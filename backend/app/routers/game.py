import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis
from app.database import get_db
from app.models.game import GameSession
from app.models.card import Card
from app.models.user import User
from app.schemas.game import GameSessionOut, SwipeRequest, SwipeResponse
from app.schemas.card import CardOut
from app.services import game_service
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


@router.post("/sessions", response_model=GameSessionOut, status_code=201)
async def create_session(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    session = await game_service.create_session(db, current_user.id)
    return session


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
        db, session, card, data.action.value, redis
    )
    return SwipeResponse(**response_data)


@router.get("/sessions/{session_id}/next-card", response_model=CardOut | None)
async def next_card(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    session = await _get_session_for_user(session_id, current_user, db)
    card = await recommend_next_card(db, session, redis)
    return card
