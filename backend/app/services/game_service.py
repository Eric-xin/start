"""Game session management and swipe processing."""

import random
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis
from app.models.game import GameSession, GameEvent, GameConfig, SwipeAction
from app.models.card import Card
from app.models.persona import Persona, PersonaSnapshot
from app.models.progress import (
    UserProgress,
    STRATEGY_META,
    STRATEGIES,
    DECK_META,
    DECKS,
)
from app.services import persona_engine as pe
from app.services.card_recommender import recommend_next_card
from app.schemas.card import CardOut
import numpy as np


def resolve_card(card: Card) -> CardOut:
    """Build a CardOut with {value} in the body replaced by a random value from the card's range."""
    out = CardOut.model_validate(card)
    if (
        card.value_min is not None
        and card.value_max is not None
        and card.value_step is not None
    ):
        step = card.value_step
        steps = round((card.value_max - card.value_min) / step)
        value = card.value_min + random.randint(0, steps) * step
        display = str(int(value)) if value == int(value) else str(value)
        out.body = card.body.replace("{value}", display)
    return out


COOLDOWN_TTL_SECS = 30
SNAPSHOT_INTERVAL = 10  # create a PersonaSnapshot every N cards

DEFAULT_RANK_THRESHOLDS = {
    2: {"stage": 2, "capital": 11000},
    3: {"stage": 3, "capital": 13000},
    4: {"stage": 5, "capital": 16000},
}


async def _get_config(db: AsyncSession, key: str, default):
    result = await db.execute(select(GameConfig).where(GameConfig.key == key))
    cfg = result.scalar_one_or_none()
    return cfg.value if cfg else default


# ─── User Progress ────────────────────────────────────────────────────────────


async def get_or_create_progress(db: AsyncSession, user_id: uuid.UUID) -> UserProgress:
    result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )
    progress = result.scalar_one_or_none()
    if not progress:
        progress = UserProgress(
            user_id=user_id,
            unlocked_strategies=["savings"],
            enabled_strategies=["savings"],
            unlocked_decks=["savings_core"],
            enabled_decks=["savings_core"],
            total_cards_played=0,
        )
        db.add(progress)
        await db.flush()
    # Migrate old rows that predate deck columns
    if progress.unlocked_decks is None:
        progress.unlocked_decks = ["savings_core"]
        progress.enabled_decks = ["savings_core"]
    return progress


def _check_strategy_unlocks(progress: UserProgress) -> bool:
    """Unlock new strategies and decks based on total cards played."""
    total = progress.total_cards_played
    changed = False

    # Strategies
    unlocked_s = list(progress.unlocked_strategies)
    for key, meta in STRATEGY_META.items():
        if key not in unlocked_s and total >= meta["unlock_at"]:
            unlocked_s.append(key)
            changed = True
    if changed:
        progress.unlocked_strategies = unlocked_s
        enabled_s = list(progress.enabled_strategies)
        for key in unlocked_s:
            if key not in enabled_s:
                enabled_s.append(key)
        progress.enabled_strategies = enabled_s

    # Decks
    unlocked_d = list(progress.unlocked_decks or [])
    deck_changed = False
    for key, meta in DECK_META.items():
        if meta.get("is_purchasable"):
            continue
        if key not in unlocked_d and total >= meta["unlock_at"]:
            unlocked_d.append(key)
            deck_changed = True
    if deck_changed:
        progress.unlocked_decks = unlocked_d
        enabled_d = list(progress.enabled_decks or [])
        for key in unlocked_d:
            if key not in enabled_d:
                enabled_d.append(key)
        progress.enabled_decks = enabled_d
        changed = True

    return changed


# ─── Persona ──────────────────────────────────────────────────────────────────


async def get_active_persona(db: AsyncSession, user_id: uuid.UUID) -> Persona | None:
    result = await db.execute(
        select(Persona).where(
            Persona.user_id == user_id,
            Persona.is_active == True,  # noqa: E712
        )
    )
    return result.scalar_one_or_none()


async def get_or_create_default_persona(
    db: AsyncSession, user_id: uuid.UUID
) -> Persona:
    persona = await get_active_persona(db, user_id)
    if not persona:
        # Create default persona
        persona = Persona(
            user_id=user_id,
            name="Default Persona",
            vector=pe.initialize_persona(),
            cards_played=0,
            is_active=True,
        )
        db.add(persona)
        await db.flush()
    return persona


# ─── Session ──────────────────────────────────────────────────────────────────


async def create_session(db: AsyncSession, user_id: uuid.UUID) -> GameSession:
    persona = await get_or_create_default_persona(db, user_id)
    # Ensure user progress exists
    await get_or_create_progress(db, user_id)

    session = GameSession(
        user_id=user_id,
        persona_id=persona.id,
        stage=1,
        progress=0.0,
        persona_vector=list(persona.vector),  # cached mirror for legacy compat
        topic_mastery={},
        investor_rank=1,
        capital=10000.0,
        portfolio_weights={},
        peak_capital=10000.0,
    )
    db.add(session)
    await db.flush()
    return session


# ─── Swipe Processing ─────────────────────────────────────────────────────────


def _context_score(weights: dict | None, market_state: dict | None) -> float:
    """Return a normalized score in [-1, 1] where positive favors accepting risk."""
    w = weights or {}
    m = market_state or {}

    card_score = (
        0.35 * float(w.get("sentiment", 0.0))
        + 0.45 * float(w.get("fundamentals", 0.0))
        - 0.30 * float(w.get("inflation", 0.0))
        - 0.30 * float(w.get("volatility", 0.0))
        - 0.15 * float(w.get("greed", 0.0))
    )
    market_score = (
        0.30 * float(m.get("sentiment", 0.0))
        + 0.40 * float(m.get("fundamentals", 0.0))
        - 0.30 * float(m.get("inflation", 0.0))
        - 0.35 * float(m.get("volatility", 0.0))
        - 0.15 * float(m.get("greed", 0.0))
    )

    raw = 0.6 * card_score + 0.4 * market_score
    return max(-1.0, min(1.0, raw))


_RISK_ON_HINTS = (
    "buy",
    "invest",
    "heavier",
    "concentrate",
    "let it ride",
    "run",
    "momentum",
    "go",
)

_RISK_OFF_HINTS = (
    "sell",
    "wait",
    "pause",
    "cash",
    "conservative",
    "bonds",
    "cut",
    "rebalance",
    "skip",
    "avoid",
)


def _choice_risk_signal(choice_text: str) -> float:
    """Infer risk posture from a choice string in [-1, 1]."""
    text = (choice_text or "").lower()
    on = sum(1 for token in _RISK_ON_HINTS if token in text)
    off = sum(1 for token in _RISK_OFF_HINTS if token in text)
    total = on + off
    if total == 0:
        return 0.0
    return max(-1.0, min(1.0, float(on - off) / float(total)))


def _action_quality(card: Card, action: str, regime: float) -> float:
    """Return how suitable an action is for the current card/regime in [0, 1]."""
    left_signal = _choice_risk_signal(getattr(card, "left_choice", ""))
    right_signal = _choice_risk_signal(getattr(card, "right_choice", ""))
    signal = right_signal if action == "right" else left_signal

    # Lower distance means the action matches the current regime better.
    distance = min(2.0, abs(signal - regime))
    quality = 1.0 - (distance / 2.0)
    return max(0.0, min(1.0, quality))


def compute_reward(card: Card, action: str, market_state: dict | None = None) -> float:
    """Compute signed reward: better choice gains capital, worse choice loses capital."""
    card_type = card.type if isinstance(card.type, str) else card.type.value
    regime = _context_score(getattr(card, "weights", {}), market_state)
    chosen_quality = _action_quality(card, action, regime)
    alt_action = "left" if action == "right" else "right"
    alt_quality = _action_quality(card, alt_action, regime)

    difficulty = float(card.difficulty)
    diagnostic = float(card.diagnostic_power)

    if card_type == "education":
        magnitude = 0.18 + 0.22 * diagnostic
    else:
        magnitude = 0.30 + 0.30 * difficulty

    edge = chosen_quality - alt_quality
    reward = edge * magnitude
    return max(-0.8, min(0.8, float(reward)))


def _get_lesson(card: Card, action: str, is_optimal: bool) -> str:
    if is_optimal:
        return card.right_lesson if action == "right" else card.left_lesson
    return "That decision was costly in this context. Reassess the signal before committing next time."


def update_topic_mastery(topic_mastery: dict, card: Card, reward: float) -> dict:
    mastery = dict(topic_mastery)
    topics = card.topics if isinstance(card.topics, list) else []
    for topic in topics:
        mastery[topic] = max(0.0, min(1.0, mastery.get(topic, 0.0) + reward * 0.1))
    return mastery


async def update_investor_rank(session: GameSession, db: AsyncSession) -> None:
    thresholds = await _get_config(
        db, "investor_rank_thresholds", DEFAULT_RANK_THRESHOLDS
    )
    for rank in [4, 3, 2]:
        rank_str = str(rank)
        t = thresholds.get(rank_str) or thresholds.get(rank)
        if t and session.stage >= t["stage"] and session.capital >= t["capital"]:
            session.investor_rank = rank
            return
    session.investor_rank = 1


async def update_progress(session: GameSession, db: AsyncSession) -> None:
    threshold = await _get_config(db, "stage_progression_threshold", 0.85)
    session.progress = min(1.0, session.progress + 0.02)
    if session.progress >= threshold and session.stage < 5:
        session.stage += 1
        session.progress = 0.0


async def process_swipe(
    db: AsyncSession,
    session: GameSession,
    card: Card,
    action: str,
    redis: Redis,
) -> dict:
    # Load the global persona (fallback to session vector if no persona_id)
    persona: Persona | None = None
    if session.persona_id:
        persona_result = await db.execute(
            select(Persona).where(Persona.id == session.persona_id)
        )
        persona = persona_result.scalar_one_or_none()

    if persona:
        p_vec = list(persona.vector)
    else:
        p_vec = list(session.persona_vector or pe.initialize_persona())

    persona_before = p_vec

    # Encode
    p_t = np.array(p_vec, dtype=np.float32)
    e_t = pe.encode_event(card)
    a_t = pe.encode_action(action)
    s_t = pe.encode_state(session)
    current_market = getattr(session, "market_state", None)
    reward = compute_reward(card, action, current_market)
    alt_action = "left" if action == "right" else "right"
    alt_reward = compute_reward(card, alt_action, current_market)
    is_optimal = reward >= alt_reward

    # Update persona
    rates = await _get_config(db, "persona_update_rates", None)
    p_new = pe.update_persona(p_t, e_t, a_t, s_t, reward, rates)
    persona_after = p_new.tolist()

    # Persist persona update
    if persona:
        persona.vector = persona_after
        persona.cards_played += 1
        persona.updated_at = datetime.now(timezone.utc)

        # Snapshot every SNAPSHOT_INTERVAL cards
        if persona.cards_played % SNAPSHOT_INTERVAL == 0:
            traits = pe.compute_traits(p_new)
            snapshot = PersonaSnapshot(
                persona_id=persona.id,
                cards_played=persona.cards_played,
                vector=persona_after,
                traits=traits,
            )
            db.add(snapshot)

    # Update user progress
    progress = await get_or_create_progress(db, session.user_id)
    progress.total_cards_played += 1
    _check_strategy_unlocks(progress)
    progress.updated_at = datetime.now(timezone.utc)

    # Update capital — use multi-dimensional weights via market state
    from app.services.portfolio_service import (
        _update_market_state,
        _compute_market_multiplier,
    )

    session_market = getattr(session, "market_state", None) or {}
    session_market = _update_market_state(session_market, card, action, reward)
    market_mult = _compute_market_multiplier(session_market)

    alpha = getattr(card, "alpha", 1.0)
    capital_delta = reward * 200 * alpha * market_mult
    session.capital += capital_delta
    if session.capital > session.peak_capital:
        session.peak_capital = session.capital

    # Update session state (mirror persona vector for legacy compat)
    session.persona_vector = persona_after
    session.topic_mastery = update_topic_mastery(session.topic_mastery, card, reward)
    session.last_card_type = (
        card.type if isinstance(card.type, str) else card.type.value
    )
    await update_progress(session, db)
    await update_investor_rank(session, db)
    session.updated_at = datetime.now(timezone.utc)

    # Record event
    event = GameEvent(
        session_id=session.id,
        card_id=card.id,
        action=SwipeAction(action),
        reward=reward,
        persona_before=persona_before,
        persona_after=persona_after,
    )
    db.add(event)

    # Cooldown in Redis
    cooldown_key = f"cooldown:{session.id}:{card.id}"
    try:
        await redis.setex(cooldown_key, card.cooldown * COOLDOWN_TTL_SECS, "1")
    except Exception:
        # Allow gameplay to continue when Redis is not available locally.
        pass

    enabled_strat = progress.enabled_strategies if progress else STRATEGIES
    enabled_deck = progress.enabled_decks if progress else None
    next_card_orm = await recommend_next_card(
        db,
        session,
        redis,
        enabled_strategies=enabled_strat,
        enabled_decks=enabled_deck,
    )
    next_card_out = resolve_card(next_card_orm) if next_card_orm else None

    lesson = _get_lesson(card, action, is_optimal)
    return {
        "lesson": lesson,
        "reward": reward,
        "session": session,
        "next_card": next_card_out,
    }
