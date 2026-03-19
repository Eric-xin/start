"""Leaderboard router — ranking by Sharpe ratio and performance."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.schemas.leaderboard import LeaderboardOut
from app.services import leaderboard_service

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("", response_model=LeaderboardOut)
async def get_leaderboard(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the leaderboard ranked by net worth.
    Includes current user's rank in the response.
    """
    leaderboard = await leaderboard_service.get_leaderboard(db, current_user.id, limit)
    return leaderboard
