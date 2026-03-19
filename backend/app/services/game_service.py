"""Game session management and swipe processing."""
import random
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis
from app.models.game import GameSession, GameEvent, GameConfig, SwipeAction
from app.models.card import Card
from app.models.persona import Persona, PersonaSnapshot
from app.models.progress import UserProgress, STRATEGY_META, STRATEGIES, DECK_META, DECKS
from app.services import persona_engine as pe
from app.services.card_recommender import recommend_next_card
from app.schemas.card import CardOut
import numpy as np


def resolve_card(card: Card) -> CardOut:
    """Build a CardOut with {value} in the body replaced by a random value from the card's range."""
    out = CardOut.model_validate(card)
    if card.value_min is not None and card.value_max is not None and card.value_step is not None:
        step = card.value_step
        steps = round((card.value_max - card.value_min) / step)
        value = card.value_min + random.randint(0, steps) * step
        display = str(int(value)) if value == int(value) else str(value)
        out.body = card.body.replace("{value}", display)
    return out


COOLDOWN_TTL_SECS = 30
SNAPSHOT_INTERVAL = 10  # create a PersonaSnapshot every N cards
DAILY_TARGET_CARDS = 10
STREAK_BONUS_CAPITAL = 1000.0

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
            streak_count=0,
            last_streak_date=None,
        )
        db.add(progress)
        await db.flush()
    # Migrate old rows that predate deck columns
    if progress.unlocked_decks is None:
        progress.unlocked_decks = ["savings_core"]
        progress.enabled_decks = ["savings_core"]
    if progress.streak_count is None:
        progress.streak_count = 0
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


async def get_or_create_default_persona(db: AsyncSession, user_id: uuid.UUID) -> Persona:
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
        is_daily=False,
        daily_cards_played=0,
        daily_target=DAILY_TARGET_CARDS,
        daily_completed=False,
        streak_bonus_awarded=0.0,
    )
    db.add(session)
    await db.flush()
    return session


async def create_or_get_daily_session(db: AsyncSession, user_id: uuid.UUID) -> GameSession:
    persona = await get_or_create_default_persona(db, user_id)
    await get_or_create_progress(db, user_id)

    today = datetime.now(timezone.utc).date()

    existing_result = await db.execute(
        select(GameSession)
        .where(
            GameSession.user_id == user_id,
            GameSession.is_daily == True,  # noqa: E712
            GameSession.daily_date == today,
        )
        .order_by(GameSession.updated_at.desc())
    )
    existing = existing_result.scalars().first()
    if existing:
        return existing

    session = GameSession(
        user_id=user_id,
        persona_id=persona.id,
        stage=1,
        progress=0.0,
        persona_vector=list(persona.vector),
        topic_mastery={},
        investor_rank=1,
        capital=10000.0,
        portfolio_weights={},
        peak_capital=10000.0,
        is_daily=True,
        daily_date=today,
        daily_cards_played=0,
        daily_target=DAILY_TARGET_CARDS,
        daily_completed=False,
        streak_bonus_awarded=0.0,
    )
    db.add(session)
    await db.flush()
    return session


def build_daily_status(progress: UserProgress, session: GameSession | None) -> dict:
    cards_done = 0
    target = DAILY_TARGET_CARDS
    completed = False

    if session is not None:
        cards_done = int(session.daily_cards_played)
        target = int(session.daily_target)
        completed = bool(session.daily_completed)

    remaining = max(0, target - cards_done)
    return {
        "streak_count": int(progress.streak_count),
        "cards_completed_today": cards_done,
        "daily_target": target,
        "remaining_cards": remaining,
        "completed_today": completed,
        "streak_bonus_capital": STREAK_BONUS_CAPITAL,
    }


def apply_streak_on_daily_completion(progress: UserProgress, session: GameSession) -> None:
    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)

    # Already credited today
    if progress.last_streak_date == today:
        return

    if progress.last_streak_date == yesterday:
        progress.streak_count = int(progress.streak_count) + 1
    else:
        progress.streak_count = 1

    progress.last_streak_date = today
    session.streak_bonus_awarded = STREAK_BONUS_CAPITAL
    session.capital += STREAK_BONUS_CAPITAL
    session.peak_capital = max(session.peak_capital, session.capital)


# ─── Swipe Processing ─────────────────────────────────────────────────────────

def compute_reward(card: Card, action: str) -> float:
    card_type = card.type if isinstance(card.type, str) else card.type.value
    if card_type == "education":
        return float(card.diagnostic_power)
    if action == "right":
        return float(card.difficulty) * 0.5 + 0.1
    return float(1.0 - card.difficulty) * 0.3


def _get_lesson(card: Card, action: str) -> str:
    return card.right_lesson if action == "right" else card.left_lesson


def update_topic_mastery(topic_mastery: dict, card: Card, reward: float) -> dict:
    mastery = dict(topic_mastery)
    topics = card.topics if isinstance(card.topics, list) else []
    for topic in topics:
        mastery[topic] = min(1.0, mastery.get(topic, 0.0) + reward * 0.1)
    return mastery


async def update_investor_rank(session: GameSession, db: AsyncSession) -> None:
    thresholds = await _get_config(db, "investor_rank_thresholds", DEFAULT_RANK_THRESHOLDS)
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
    if session.is_daily and session.daily_completed:
        return {
            "lesson": "Daily session complete. Come back tomorrow for fresh cards.",
            "reward": 0.0,
            "session": session,
            "next_card": None,
        }

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
    reward = compute_reward(card, action)

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

    if session.is_daily:
        session.daily_cards_played += 1
        if session.daily_cards_played >= session.daily_target:
            session.daily_completed = True
            apply_streak_on_daily_completion(progress, session)

    # Update capital (alpha scales the impact — e.g. rate cuts hit harder than trivia)
    alpha = getattr(card, "alpha", 1.0)
    capital_delta = reward * 200 * alpha
    session.capital += capital_delta
    if session.capital > session.peak_capital:
        session.peak_capital = session.capital

    # Update session state (mirror persona vector for legacy compat)
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

    # Cooldown in Redis
    cooldown_key = f"cooldown:{session.id}:{card.id}"
    try:
        await redis.setex(cooldown_key, card.cooldown * COOLDOWN_TTL_SECS, "1")
    except Exception:
        # Allow gameplay to continue when Redis is not available locally.
        pass

    enabled_strat = progress.enabled_strategies if progress else STRATEGIES
    enabled_deck = progress.enabled_decks if progress else None
    next_card_orm = None
    if not (session.is_daily and session.daily_completed):
        next_card_orm = await recommend_next_card(
            db, session, redis,
            enabled_strategies=enabled_strat,
            enabled_decks=enabled_deck,
        )
    next_card_out = resolve_card(next_card_orm) if next_card_orm else None

    lesson = _get_lesson(card, action)
    return {
        "lesson": lesson,
        "reward": reward,
        "session": session,
        "next_card": next_card_out,
    }
