"""Achievements router — list all achievements and user unlocks."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.schemas.achievement import AchievementOut
from app.services import achievement_service as ach_svc

router = APIRouter(prefix="/api/achievements", tags=["achievements"])


@router.get("", response_model=list[AchievementOut])
async def list_achievements(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all achievements with unlock status for the current user."""
    all_achievements = await ach_svc.get_all_achievements(db)
    unlocked_keys = await ach_svc.get_user_achievement_keys(db, current_user.id)
    user_achievements = await ach_svc.get_user_achievements(db, current_user.id)

    # Build a map of key -> unlocked_at
    unlock_times = {}
    for ua in user_achievements:
        unlock_times[ua.achievement.key] = ua.unlocked_at.isoformat() if ua.unlocked_at else None

    return [
        AchievementOut(
            id=str(a.id),
            key=a.key,
            category=a.category,
            title=a.title,
            description=a.description,
            emoji=a.emoji,
            tier=a.tier,
            condition_type=a.condition_type,
            condition_value=a.condition_value,
            unlocked=a.key in unlocked_keys,
            unlocked_at=unlock_times.get(a.key),
        )
        for a in all_achievements
    ]
