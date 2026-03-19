"""Achievement service — check conditions and unlock achievements."""
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sa_func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models.achievement import Achievement, UserAchievement
from app.models.portfolio import UserPortfolio, CardPlay
from app.models.progress import UserProgress


async def get_all_achievements(db: AsyncSession) -> list[Achievement]:
    result = await db.execute(
        select(Achievement).where(Achievement.is_active == True).order_by(Achievement.category, Achievement.condition_value)  # noqa: E712
    )
    return list(result.scalars().all())


async def get_user_achievement_keys(db: AsyncSession, user_id: uuid.UUID) -> set[str]:
    result = await db.execute(
        select(Achievement.key)
        .join(UserAchievement, UserAchievement.achievement_id == Achievement.id)
        .where(UserAchievement.user_id == user_id)
    )
    return set(result.scalars().all())


async def get_user_achievements(db: AsyncSession, user_id: uuid.UUID) -> list[UserAchievement]:
    result = await db.execute(
        select(UserAchievement)
        .where(UserAchievement.user_id == user_id)
        .order_by(UserAchievement.unlocked_at.desc())
    )
    return list(result.scalars().all())


async def _count_actions(db: AsyncSession, portfolio_id: uuid.UUID, action: str) -> int:
    result = await db.execute(
        select(sa_func.count())
        .select_from(CardPlay)
        .where(CardPlay.portfolio_id == portfolio_id, CardPlay.action == action)
    )
    return result.scalar() or 0


def _check_condition(
    condition_type: str,
    condition_value: float,
    portfolio: UserPortfolio,
    progress: UserProgress,
    action_counts: dict[str, int],
) -> bool:
    v = condition_value

    if condition_type == "total_cards_played":
        return portfolio.total_cards_played >= v
    if condition_type == "stage_reached":
        return portfolio.stage >= v
    if condition_type == "capital_reached":
        return portfolio.capital >= v
    if condition_type == "net_worth_reached":
        return portfolio.net_worth >= v
    if condition_type == "peak_net_worth":
        return portfolio.peak_net_worth >= v
    if condition_type == "income_streak":
        return portfolio.income_streak >= v
    if condition_type == "investor_rank":
        return portfolio.investor_rank >= v

    if condition_type == "topics_mastered":
        mastery = portfolio.topic_mastery or {}
        mastered = sum(1 for val in mastery.values() if val >= 0.5)
        return mastered >= v

    if condition_type == "right_actions":
        return action_counts.get("right", 0) >= v
    if condition_type == "left_actions":
        return action_counts.get("left", 0) >= v

    if condition_type == "strategies_unlocked":
        return len(progress.unlocked_strategies or []) >= v
    if condition_type == "decks_unlocked":
        return len(progress.unlocked_decks or []) >= v

    return False


async def check_and_unlock(
    db: AsyncSession,
    user_id: uuid.UUID,
    portfolio: UserPortfolio,
    progress: UserProgress,
) -> list[Achievement]:
    """Check all achievements and unlock any newly earned ones.

    Returns the list of newly unlocked Achievement objects.
    """
    all_achievements = await get_all_achievements(db)
    already_unlocked = await get_user_achievement_keys(db, user_id)

    # Only query action counts if there are action-based achievements to check
    candidates = [a for a in all_achievements if a.key not in already_unlocked]
    needs_action_counts = any(
        a.condition_type in ("right_actions", "left_actions") for a in candidates
    )

    action_counts: dict[str, int] = {}
    if needs_action_counts:
        action_counts["right"] = await _count_actions(db, portfolio.id, "right")
        action_counts["left"] = await _count_actions(db, portfolio.id, "left")

    newly_unlocked: list[Achievement] = []
    for achievement in candidates:
        if _check_condition(
            achievement.condition_type,
            achievement.condition_value,
            portfolio,
            progress,
            action_counts,
        ):
            # ON CONFLICT DO NOTHING ensures idempotency even under concurrent requests
            stmt = (
                pg_insert(UserAchievement)
                .values(user_id=user_id, achievement_id=achievement.id)
                .on_conflict_do_nothing(constraint="uq_user_achievement")
            )
            result = await db.execute(stmt)
            if result.rowcount:
                newly_unlocked.append(achievement)

    return newly_unlocked
