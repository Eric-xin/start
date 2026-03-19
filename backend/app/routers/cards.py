from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.card import Card, CardType
from app.models.user import User
from app.schemas.card import CardOut
from app.core.dependencies import get_current_active_user
from app.services.game_service import resolve_card

router = APIRouter(prefix="/api/cards", tags=["cards"])


@router.get("", response_model=list[CardOut])
async def get_cards(
    stage: int | None = Query(None, ge=1, le=5),
    type: CardType | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Card).where(Card.is_active == True)  # noqa: E712
    if stage is not None:
        query = query.where(Card.stage_min <= stage, Card.stage_max >= stage)
    if type is not None:
        query = query.where(Card.type == type)
    query = query.limit(limit)
    result = await db.execute(query)
    return [resolve_card(card) for card in result.scalars().all()]
