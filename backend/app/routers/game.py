import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis
from app.database import get_db
from app.models.game import GameSession
from app.models.card import Card
from app.models.user import User
from app.models.game import GameEvent
from app.schemas.game import GameSessionOut, SwipeRequest, SwipeResponse, GameEventOut, DailyStatusOut
from app.schemas.card import CardOut
from app.services import game_service
from app.services.game_service import resolve_card
from app.services.card_recommender import recommend_next_card
from app.core.dependencies import get_current_active_user
from app.core.redis_client import get_redis

router = APIRouter(prefix="/api/game", tags=["game"])


async def _get_session_for_user(
    session_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> GameSession:
    result = await db.execute(
        select(GameSession).where(
            GameSession.id == session_id,
            GameSession.user_id == user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/sessions", response_model=list[GameSessionOut])
async def list_sessions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GameSession)
        .where(GameSession.user_id == current_user.id)
        .order_by(GameSession.updated_at.desc())
    )
    return result.scalars().all()


@router.post("/sessions", response_model=GameSessionOut, status_code=201)
async def create_session(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    session = await game_service.create_session(db, current_user.id)
    return session


@router.post("/daily-session", response_model=GameSessionOut, status_code=201)
async def create_daily_session(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    session = await game_service.create_or_get_daily_session(db, current_user.id)
    return session


@router.get("/daily-status", response_model=DailyStatusOut)
async def get_daily_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.now(timezone.utc).date()
    progress = await game_service.get_or_create_progress(db, current_user.id)
    daily_session_result = await db.execute(
        select(GameSession)
        .where(
            GameSession.user_id == current_user.id,
            GameSession.is_daily == True,  # noqa: E712
            GameSession.daily_date == today,
        )
        .order_by(GameSession.updated_at.desc())
    )
    daily_session = daily_session_result.scalars().first()
    return game_service.build_daily_status(progress, daily_session)


@router.get("/sessions/{session_id}", response_model=GameSessionOut)
async def get_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_session_for_user(session_id, current_user, db)


@router.post("/sessions/{session_id}/swipe", response_model=SwipeResponse)
async def swipe(
    session_id: uuid.UUID,
    data: SwipeRequest,
    x_language: str | None = Header(default=None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    session = await _get_session_for_user(session_id, current_user, db)

    result = await db.execute(select(Card).where(Card.id == data.card_id, Card.is_active == True))  # noqa: E712
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    response_data = await game_service.process_swipe(
        db, session, card, data.action.value, redis, x_language
    )
    return SwipeResponse(**response_data)


@router.get("/sessions/{session_id}/history", response_model=list[GameEventOut])
async def get_session_history(
    session_id: uuid.UUID,
    x_language: str | None = Header(default=None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all swipe events for a session, with card details included."""
    await _get_session_for_user(session_id, current_user, db)  # auth check
    result = await db.execute(
        select(GameEvent, Card)
        .outerjoin(Card, GameEvent.card_id == Card.id)
        .where(GameEvent.session_id == session_id)
        .order_by(GameEvent.created_at.asc())
    )
    rows = result.all()
    out = []
    for event, card in rows:
        out.append(GameEventOut(
            id=event.id,
            card_id=event.card_id,
            action=event.action.value if hasattr(event.action, "value") else event.action,
            reward=event.reward,
            card=resolve_card(card, x_language) if card else None,
            created_at=event.created_at,
        ))
    return out


@router.get("/sessions/{session_id}/next-card", response_model=CardOut | None)
async def next_card(
    session_id: uuid.UUID,
    x_language: str | None = Header(default=None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    from app.services.game_service import get_or_create_progress, resolve_card
    session = await _get_session_for_user(session_id, current_user, db)
    if session.is_daily and session.daily_completed:
        return None
    progress = await get_or_create_progress(db, current_user.id)
    card = await recommend_next_card(
        db, session, redis,
        enabled_strategies=progress.enabled_strategies,
        enabled_decks=progress.enabled_decks,
    )
    return resolve_card(card, x_language) if card else None
