"""User progress — unlocked/enabled strategies and decks."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.progress import STRATEGY_META, STRATEGIES, DECK_META, DECKS
from app.schemas.progress import UserProgressOut, UserProgressUpdate, StrategyInfo, DeckInfo
from app.services.game_service import get_or_create_progress
from app.core.dependencies import get_current_active_user

router = APIRouter(prefix="/api/progress", tags=["progress"])


def _build_progress_out(progress) -> UserProgressOut:
    unlocked_d = progress.unlocked_decks or []
    enabled_d = progress.enabled_decks or []

    strategies = [
        StrategyInfo(
            key=k,
            label=STRATEGY_META[k]["label"],
            stage=STRATEGY_META[k]["stage"],
            unlock_at=STRATEGY_META[k]["unlock_at"],
            is_unlocked=k in progress.unlocked_strategies,
            is_enabled=k in progress.enabled_strategies,
        )
        for k in STRATEGIES
    ]
    decks = [
        DeckInfo(
            key=k,
            label=DECK_META[k]["label"],
            strategy=DECK_META[k]["strategy"],
            description=DECK_META[k]["description"],
            unlock_at=DECK_META[k]["unlock_at"],
            is_unlocked=k in unlocked_d,
            is_enabled=k in enabled_d,
        )
        for k in DECKS
    ]
    return UserProgressOut(
        unlocked_strategies=progress.unlocked_strategies,
        enabled_strategies=progress.enabled_strategies,
        unlocked_decks=unlocked_d,
        enabled_decks=enabled_d,
        total_cards_played=progress.total_cards_played,
        streak_count=progress.streak_count,
        last_streak_date=progress.last_streak_date,
        strategies=strategies,
        decks=decks,
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
        valid = [s for s in data.enabled_strategies if s in progress.unlocked_strategies]
        if not valid:
            raise HTTPException(status_code=400, detail="Must enable at least one unlocked strategy")
        progress.enabled_strategies = valid

    if data.enabled_decks is not None:
        unlocked_d = progress.unlocked_decks or []
        valid_d = [d for d in data.enabled_decks if d in unlocked_d]
        if not valid_d:
            raise HTTPException(status_code=400, detail="Must enable at least one unlocked deck")
        progress.enabled_decks = valid_d

    await db.commit()
    await db.refresh(progress)
    return _build_progress_out(progress)
