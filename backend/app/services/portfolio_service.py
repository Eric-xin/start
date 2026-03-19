"""Portfolio service — continuous gameplay replacing the session model."""
import random
import uuid
from datetime import datetime, date, timedelta, timezone

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis

from app.models.portfolio import UserPortfolio, CardPlay, NetWorthSnapshot
from app.models.card import Card
from app.models.persona import Persona, PersonaSnapshot
from app.models.progress import UserProgress, STRATEGY_META, DECK_META, STRATEGIES
from app.models.game import GameConfig
from app.services import persona_engine as pe
from app.services.card_recommender import recommend_next_card
from app.schemas.card import CardOut

SNAPSHOT_INTERVAL = 10
COOLDOWN_TTL_SECS = 30

DAILY_BASE_INCOME = 500.0
DAILY_STAGE_BONUS = 100.0   # per stage above 1
DAILY_STREAK_BONUS = 25.0   # per streak day
MAX_STREAK_BONUS = 250.0    # cap at 10 days

DEFAULT_RANK_THRESHOLDS = {
    2: {"stage": 2, "capital": 11_000},
    3: {"stage": 3, "capital": 13_000},
    4: {"stage": 5, "capital": 16_000},
}


# ─── Income Calculation ────────────────────────────────────────────────────────

def compute_daily_income(portfolio: UserPortfolio) -> float:
    stage_bonus = DAILY_STAGE_BONUS * (portfolio.stage - 1)
    streak_bonus = min(portfolio.income_streak * DAILY_STREAK_BONUS, MAX_STREAK_BONUS)
    return DAILY_BASE_INCOME + stage_bonus + streak_bonus


# ─── Card Resolver ─────────────────────────────────────────────────────────────

def resolve_card(card: Card) -> CardOut:
    out = CardOut.model_validate(card)
    if card.value_min is not None and card.value_max is not None and card.value_step is not None:
        step = card.value_step
        steps = round((card.value_max - card.value_min) / step)
        value = card.value_min + random.randint(0, steps) * step
        display = str(int(value)) if value == int(value) else str(value)
        out.body = card.body.replace("{value}", display)
    return out


# ─── Config ────────────────────────────────────────────────────────────────────

async def _get_config(db: AsyncSession, key: str, default):
    result = await db.execute(select(GameConfig).where(GameConfig.key == key))
    cfg = result.scalar_one_or_none()
    return cfg.value if cfg else default


# ─── Snapshot ──────────────────────────────────────────────────────────────────

async def _upsert_snapshot(db: AsyncSession, portfolio: UserPortfolio) -> None:
    today = date.today()
    result = await db.execute(
        select(NetWorthSnapshot).where(
            NetWorthSnapshot.portfolio_id == portfolio.id,
            NetWorthSnapshot.snapshot_date == today,
        )
    )
    snapshot = result.scalar_one_or_none()
    if snapshot:
        snapshot.net_worth = portfolio.net_worth
        snapshot.capital = portfolio.capital
    else:
        db.add(NetWorthSnapshot(
            portfolio_id=portfolio.id,
            net_worth=portfolio.net_worth,
            capital=portfolio.capital,
            snapshot_date=today,
        ))


# ─── Persona ───────────────────────────────────────────────────────────────────

async def get_or_create_default_persona(db: AsyncSession, user_id: uuid.UUID) -> Persona:
    result = await db.execute(
        select(Persona).where(
            Persona.user_id == user_id,
            Persona.is_active == True,  # noqa: E712
        )
    )
    persona = result.scalar_one_or_none()
    if not persona:
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


# ─── Progress ──────────────────────────────────────────────────────────────────

async def get_or_create_progress(db: AsyncSession, user_id: uuid.UUID) -> UserProgress:
    result = await db.execute(select(UserProgress).where(UserProgress.user_id == user_id))
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
    if progress.unlocked_decks is None:
        progress.unlocked_decks = ["savings_core"]
        progress.enabled_decks = ["savings_core"]
    return progress


def _check_strategy_unlocks(progress: UserProgress) -> None:
    total = progress.total_cards_played
    unlocked_s = list(progress.unlocked_strategies)
    changed = False
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


# ─── Portfolio ────────────────────────────────────────────────────────────────

async def get_or_create_portfolio(db: AsyncSession, user_id: uuid.UUID) -> UserPortfolio:
    result = await db.execute(select(UserPortfolio).where(UserPortfolio.user_id == user_id))
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        persona = await get_or_create_default_persona(db, user_id)
        await get_or_create_progress(db, user_id)
        portfolio = UserPortfolio(
            user_id=user_id,
            capital=10_000.0,
            net_worth=10_000.0,
            peak_net_worth=10_000.0,
            total_income_received=10_000.0,
            persona_id=persona.id,
            persona_vector=list(persona.vector),
        )
        db.add(portfolio)
        await db.flush()
        await _upsert_snapshot(db, portfolio)
        await db.commit()
        await db.refresh(portfolio)
    return portfolio


# ─── Daily Income ─────────────────────────────────────────────────────────────

async def claim_daily_income(db: AsyncSession, portfolio: UserPortfolio) -> float | None:
    today = date.today()
    if portfolio.last_income_date == today:
        return None

    yesterday = today - timedelta(days=1)
    if portfolio.last_income_date == yesterday:
        portfolio.income_streak += 1
    else:
        portfolio.income_streak = 1

    amount = compute_daily_income(portfolio)
    portfolio.capital += amount
    portfolio.net_worth += amount
    portfolio.total_income_received += amount
    portfolio.last_income_date = today
    portfolio.peak_net_worth = max(portfolio.peak_net_worth, portfolio.net_worth)
    portfolio.updated_at = datetime.now(timezone.utc)

    await _upsert_snapshot(db, portfolio)
    await db.commit()
    await db.refresh(portfolio)
    return amount


# ─── Card Play ────────────────────────────────────────────────────────────────

def _compute_reward(card: Card, action: str) -> float:
    card_type = card.type if isinstance(card.type, str) else card.type.value
    if card_type == "education":
        return float(card.diagnostic_power)
    if action == "right":
        return float(card.difficulty) * 0.5 + 0.1
    return float(1.0 - card.difficulty) * 0.3


def _update_topic_mastery(topic_mastery: dict, card: Card, reward: float) -> dict:
    mastery = dict(topic_mastery or {})
    for topic in (card.topics if isinstance(card.topics, list) else []):
        mastery[topic] = min(1.0, mastery.get(topic, 0.0) + reward * 0.1)
    return mastery


def _compute_investor_rank(portfolio: UserPortfolio, thresholds: dict) -> int:
    for rank in [4, 3, 2]:
        t = thresholds.get(str(rank)) or thresholds.get(rank)
        if t and portfolio.stage >= t["stage"] and portfolio.capital >= t["capital"]:
            return rank
    return 1


async def play_card(
    db: AsyncSession,
    portfolio: UserPortfolio,
    card: Card,
    action: str,
    redis: Redis | None,
) -> dict:
    # Load active persona
    persona: Persona | None = None
    if portfolio.persona_id:
        r = await db.execute(select(Persona).where(Persona.id == portfolio.persona_id))
        persona = r.scalar_one_or_none()

    p_vec = list(persona.vector if persona else (portfolio.persona_vector or pe.initialize_persona()))
    p_t = np.array(p_vec, dtype=np.float32)
    e_t = pe.encode_event(card)
    a_t = pe.encode_action(action)
    s_t = pe.encode_state_portfolio(portfolio)
    reward = _compute_reward(card, action)

    # Update persona vector
    rates = await _get_config(db, "persona_update_rates", None)
    p_new = pe.update_persona(p_t, e_t, a_t, s_t, reward, rates)
    persona_after = p_new.tolist()

    if persona:
        persona.vector = persona_after
        persona.cards_played += 1
        persona.updated_at = datetime.now(timezone.utc)
        if persona.cards_played % SNAPSHOT_INTERVAL == 0:
            db.add(PersonaSnapshot(
                persona_id=persona.id,
                cards_played=persona.cards_played,
                vector=persona_after,
                traits=pe.compute_traits(p_new),
            ))

    # Capital update
    alpha = getattr(card, "alpha", 1.0)
    capital_before = portfolio.capital
    capital_delta = reward * 200 * alpha
    portfolio.capital = max(portfolio.capital + capital_delta, 100.0)
    portfolio.net_worth = portfolio.capital
    portfolio.peak_net_worth = max(portfolio.peak_net_worth, portfolio.net_worth)

    # Portfolio state update
    portfolio.persona_vector = persona_after
    portfolio.topic_mastery = _update_topic_mastery(portfolio.topic_mastery, card, reward)
    portfolio.last_card_type = card.type if isinstance(card.type, str) else card.type.value
    portfolio.total_cards_played += 1
    portfolio.updated_at = datetime.now(timezone.utc)

    # Stage progression: advance every 20 cards
    new_stage = min((portfolio.total_cards_played // 20) + 1, 5)
    if new_stage > portfolio.stage:
        portfolio.stage = new_stage

    # Investor rank
    thresholds = await _get_config(db, "investor_rank_thresholds", DEFAULT_RANK_THRESHOLDS)
    portfolio.investor_rank = _compute_investor_rank(portfolio, thresholds)

    # Update user progress (strategy/deck unlocks)
    progress = await get_or_create_progress(db, portfolio.user_id)
    progress.total_cards_played += 1
    _check_strategy_unlocks(progress)
    progress.updated_at = datetime.now(timezone.utc)

    # Record card play
    db.add(CardPlay(
        portfolio_id=portfolio.id,
        card_id=card.id,
        action=action,
        reward=reward,
        capital_before=capital_before,
        capital_after=portfolio.capital,
    ))

    # Cooldown
    if redis:
        cooldown_key = f"cooldown:{portfolio.id}:{card.id}"
        try:
            await redis.setex(cooldown_key, card.cooldown * COOLDOWN_TTL_SECS, "1")
        except Exception:
            pass

    await _upsert_snapshot(db, portfolio)
    await db.commit()
    await db.refresh(portfolio)

    # Recommend next card
    next_card_orm = await recommend_next_card(
        db, portfolio, redis,
        enabled_strategies=progress.enabled_strategies,
        enabled_decks=progress.enabled_decks,
    )
    next_card_out = resolve_card(next_card_orm) if next_card_orm else None
    lesson = card.right_lesson if action == "right" else card.left_lesson

    return {
        "lesson": lesson,
        "reward": reward,
        "capital_before": capital_before,
        "capital_after": portfolio.capital,
        "net_worth": portfolio.net_worth,
        "next_card": next_card_out,
        "portfolio": portfolio,
    }
