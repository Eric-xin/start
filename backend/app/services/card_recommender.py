"""
Card recommender — scores cards and returns one via softmax sampling.
Uses Redis for cooldown tracking.
"""
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis
from app.models.card import Card
from app.models.game import GameSession
from app.services.persona_engine import TOPIC_CATS, CARD_TYPE_IDX, encode_event

# Score component weights
WEIGHTS = {
    "stage_fit": 0.25,
    "learning_need": 0.20,
    "persona_value": 0.20,
    "timing_fit": 0.15,
    "diversity": 0.10,
    "repetition_penalty": 0.05,
    "difficulty_mismatch_penalty": 0.05,
}

SOFTMAX_TEMP = 1.0
COOLDOWN_TTL_SECS = 30  # per cooldown turn
REDIS_UNAVAILABLE = False


def compute_stage_fit(card: Card, stage: int) -> float:
    if card.stage_min <= stage <= card.stage_max:
        # Prefer cards closer to current stage
        center = (card.stage_min + card.stage_max) / 2
        return 1.0 - abs(stage - center) / 5.0
    return 0.0


def compute_learning_need(card: Card, topic_mastery: dict) -> float:
    if not card.topics:
        return 0.5
    scores = []
    for topic in card.topics:
        mastery = topic_mastery.get(topic, 0.0)
        scores.append(1.0 - mastery)  # prefer low-mastery topics
    return float(np.mean(scores))


def compute_persona_value(card: Card, persona_vector: list) -> float:
    """How well the card aligns with the persona's current state."""
    p = np.array(persona_vector, dtype=np.float32)
    e = encode_event(card)
    # Cosine similarity in [-1, 1], shifted to [0, 1]
    cos_sim = float(np.dot(p, e) / (np.linalg.norm(p) * np.linalg.norm(e) + 1e-8))
    return (cos_sim + 1.0) / 2.0


def compute_timing_fit(card: Card, session: GameSession) -> float:
    """Event/action cards matter more at higher stages."""
    card_type = card.type if isinstance(card.type, str) else card.type.value
    if card_type == "education":
        return 0.7 if session.stage <= 2 else 0.4
    elif card_type == "event":
        return 0.4 + session.stage * 0.1
    else:  # action
        return 0.3 + session.stage * 0.12


def compute_diversity(card: Card, last_card_type: str | None) -> float:
    card_type = card.type if isinstance(card.type, str) else card.type.value
    if last_card_type == card_type:
        return 0.3  # penalize same type in a row
    return 1.0


def compute_difficulty_mismatch(card: Card, session: GameSession) -> float:
    expected_difficulty = session.stage / 5.0
    return abs(card.difficulty - expected_difficulty)


async def get_cooldown_penalty(card: Card, session_id: str, redis: Redis) -> float:
    global REDIS_UNAVAILABLE
    if REDIS_UNAVAILABLE:
        return 0.0

    key = f"cooldown:{session_id}:{card.id}"
    try:
        exists = await redis.exists(key)
        return 1.0 if exists else 0.0
    except Exception:
        # Local/dev environments may run without Redis; treat as no cooldown.
        REDIS_UNAVAILABLE = True
        return 0.0


def _softmax(scores: np.ndarray, temp: float = 1.0) -> np.ndarray:
    scaled = scores / temp
    scaled -= scaled.max()  # numerical stability
    exp_s = np.exp(scaled)
    return exp_s / exp_s.sum()


async def score_card(
    card: Card,
    session: GameSession,
    session_id: str,
    redis: Redis,
) -> float:
    persona = session.persona_vector if isinstance(session.persona_vector, list) else []
    topic_mastery = session.topic_mastery if isinstance(session.topic_mastery, dict) else {}

    stage_fit = compute_stage_fit(card, session.stage)
    if stage_fit == 0.0:
        return 0.0  # card not eligible for this stage

    learning_need = compute_learning_need(card, topic_mastery)
    persona_value = compute_persona_value(card, persona) if persona else 0.5
    timing_fit = compute_timing_fit(card, session)
    diversity = compute_diversity(card, session.last_card_type)
    cooldown_penalty = await get_cooldown_penalty(card, session_id, redis)
    difficulty_mismatch = compute_difficulty_mismatch(card, session)

    score = (
        WEIGHTS["stage_fit"] * stage_fit
        + WEIGHTS["learning_need"] * learning_need
        + WEIGHTS["persona_value"] * persona_value
        + WEIGHTS["timing_fit"] * timing_fit
        + WEIGHTS["diversity"] * diversity
        - WEIGHTS["repetition_penalty"] * cooldown_penalty
        - WEIGHTS["difficulty_mismatch_penalty"] * difficulty_mismatch
    )
    return float(np.clip(score, 0.0, 1.0))


async def recommend_next_card(
    db: AsyncSession,
    session: GameSession,
    redis: Redis,
    enabled_strategies: list[str] | None = None,
    enabled_decks: list[str] | None = None,
) -> Card | None:
    from app.models.progress import STRATEGY_META
    # Compute the max allowed stage from enabled strategies (always include session.stage)
    if enabled_strategies:
        strategy_max = max(
            (STRATEGY_META[s]["stage"] for s in enabled_strategies if s in STRATEGY_META),
            default=session.stage,
        )
    else:
        strategy_max = session.stage
    max_stage = max(strategy_max, session.stage)

    result = await db.execute(
        select(Card).where(
            Card.is_active == True,  # noqa: E712
            Card.stage_min <= max_stage,
        )
    )
    all_cards = result.scalars().all()

    # Deck filtering: collect allowed topics from enabled decks
    if enabled_decks:
        from app.models.progress import DECK_META
        allowed_topics: set[str] = set()
        has_general_deck = False
        for dk in enabled_decks:
            meta = DECK_META.get(dk)
            if meta:
                if not meta["topics"]:
                    has_general_deck = True  # deck has no topic restriction
                else:
                    allowed_topics.update(meta["topics"])
        cards = []
        for card in all_cards:
            card_topics = card.topics if isinstance(card.topics, list) else []
            if not card_topics:
                cards.append(card)  # general card, always include
            elif has_general_deck:
                cards.append(card)  # at least one deck with no topic filter is on
            elif any(t in allowed_topics for t in card_topics):
                cards.append(card)
        if not cards:
            cards = all_cards  # fallback: don't starve the recommender
    else:
        cards = all_cards
    if not cards:
        return None

    session_id = str(session.id)
    scores = []
    for card in cards:
        s = await score_card(card, session, session_id, redis)
        scores.append(s)

    scores_arr = np.array(scores, dtype=np.float32)
    if scores_arr.sum() < 1e-8:
        # All zero scores — pick uniformly
        return cards[np.random.randint(len(cards))]

    probs = _softmax(scores_arr, SOFTMAX_TEMP)
    chosen_idx = int(np.random.choice(len(cards), p=probs))
    return cards[chosen_idx]
