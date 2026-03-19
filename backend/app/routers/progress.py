"""User progress — unlocked/enabled strategies."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.progress import STRATEGY_META, STRATEGIES
from app.schemas.progress import UserProgressOut, UserProgressUpdate, StrategyInfo
from app.services.game_service import get_or_create_progress
from app.core.dependencies import get_current_active_user

router = APIRouter(prefix="/api/progress", tags=["progress"])


def _build_progress_out(progress) -> UserProgressOut:
    strategies = []
    for key in STRATEGIES:
        meta = STRATEGY_META[key]
        strategies.append(StrategyInfo(
            key=key,
            label=meta["label"],
            stage=meta["stage"],
            unlock_at=meta["unlock_at"],
            is_unlocked=key in progress.unlocked_strategies,
            is_enabled=key in progress.enabled_strategies,
        ))
    return UserProgressOut(
        unlocked_strategies=progress.unlocked_strategies,
        enabled_strategies=progress.enabled_strategies,
        total_cards_played=progress.total_cards_played,
        strategies=strategies,
    )


@router.get("", response_model=UserProgressOut)
async def get_progress(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    progress = await get_or_create_progress(db, current_user.id)
    await db.commit()
    return _build_progress_out(progress)


@router.patch("", response_model=UserProgressOut)
async def update_progress(
    data: UserProgressUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    progress = await get_or_create_progress(db, current_user.id)

    if data.enabled_strategies is not None:
        # Can only enable strategies that are unlocked
        valid = [s for s in data.enabled_strategies if s in progress.unlocked_strategies]
        if not valid:
            raise HTTPException(status_code=400, detail="Must enable at least one unlocked strategy")
        progress.enabled_strategies = valid

    await db.commit()
    await db.refresh(progress)
    return _build_progress_out(progress)
