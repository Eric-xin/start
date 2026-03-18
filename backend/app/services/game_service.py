"""Game session management and swipe processing."""
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis
from app.models.game import GameSession, GameEvent, GameConfig, SwipeAction
from app.models.card import Card
from app.services import persona_engine as pe
from app.services.card_recommender import recommend_next_card
import numpy as np


DEFAULT_RANK_THRESHOLDS = {
    2: {"stage": 2, "capital": 11000},
    3: {"stage": 3, "capital": 13000},
    4: {"stage": 5, "capital": 16000},
}


async def _get_config(db: AsyncSession, key: str, default):
    result = await db.execute(select(GameConfig).where(GameConfig.key == key))
    cfg = result.scalar_one_or_none()
    if cfg:
        return cfg.value
    return default


async def create_session(db: AsyncSession, user_id: uuid.UUID) -> GameSession:
    persona = pe.initialize_persona()
    session = GameSession(
        user_id=user_id,
        stage=1,
        progress=0.0,
        persona_vector=persona,
        topic_mastery={},
        investor_rank=1,
        capital=10000.0,
        portfolio_weights={},
        peak_capital=10000.0,
    )
    db.add(session)
    await db.flush()
    return session


def compute_reward(card: Card, action: str) -> float:
    """Compute reward for a swipe decision."""
    card_type = card.type if isinstance(card.type, str) else card.type.value

    if card_type == "education":
        return float(card.diagnostic_power)

    # For event/action cards, right swipe is generally "invest/act" — reward based on difficulty
    if action == "right":
        return float(card.difficulty) * 0.5 + 0.1
    else:
        return float(1.0 - card.difficulty) * 0.3


def _get_lesson(card: Card, action: str) -> str:
    return card.right_lesson if action == "right" else card.left_lesson


def update_topic_mastery(topic_mastery: dict, card: Card, reward: float) -> dict:
    mastery = dict(topic_mastery)
    topics = card.topics if isinstance(card.topics, list) else []
    for topic in topics:
        current = mastery.get(topic, 0.0)
        mastery[topic] = min(1.0, current + reward * 0.1)
    return mastery


async def update_investor_rank(session: GameSession, db: AsyncSession) -> None:
    thresholds = await _get_config(db, "investor_rank_thresholds", DEFAULT_RANK_THRESHOLDS)
    # Check ranks from highest to lowest
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
    persona_before = list(session.persona_vector)

    # Encode
    p_t = np.array(persona_before, dtype=np.float32)
    e_t = pe.encode_event(card)
    a_t = pe.encode_action(action)
    s_t = pe.encode_state(session)
    reward = compute_reward(card, action)

    # Update persona
    rates = await _get_config(db, "persona_update_rates", None)
    p_new = pe.update_persona(p_t, e_t, a_t, s_t, reward, rates)
    persona_after = p_new.tolist()

    # Update capital (simple model: reward → capital change)
    capital_delta = reward * 200  # $200 per unit reward
    session.capital += capital_delta
    if session.capital > session.peak_capital:
        session.peak_capital = session.capital

    # Update session state
    session.persona_vector = persona_after
    session.topic_mastery = update_topic_mastery(session.topic_mastery, card, reward)
    session.last_card_type = card.type if isinstance(card.type, str) else card.type.value
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

    # Set cooldown in Redis
    cooldown_key = f"cooldown:{session.id}:{card.id}"
    ttl = card.cooldown * COOLDOWN_TTL_SECS
    await redis.setex(cooldown_key, ttl, "1")

    # Get next card recommendation
    next_card = await recommend_next_card(db, session, redis)

    lesson = _get_lesson(card, action)

    return {
        "lesson": lesson,
        "reward": reward,
        "session": session,
        "next_card": next_card,
    }


COOLDOWN_TTL_SECS = 30
