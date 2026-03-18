import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User, UserRole, SubscriptionTier
from app.models.card import Card
from app.models.game import GameConfig
from app.schemas.user import UserOut
from app.schemas.card import CardOut, CardCreate, CardUpdate
from app.core.dependencies import require_admin
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])


class ConfigPatch(BaseModel):
    value: dict | list | float | str | int
    description: str | None = None


class UserAdminUpdate(BaseModel):
    role: UserRole | None = None
    subscription_tier: SubscriptionTier | None = None
    is_verified: bool | None = None


@router.get("/config")
async def get_config(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GameConfig))
    configs = result.scalars().all()
    return {c.key: c.value for c in configs}


@router.patch("/config/{key}")
async def update_config(
    key: str,
    data: ConfigPatch,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GameConfig).where(GameConfig.key == key))
    config = result.scalar_one_or_none()
    if not config:
        config = GameConfig(key=key, value=data.value, description=data.description, updated_by=admin.id)
        db.add(config)
    else:
        config.value = data.value
        if data.description:
            config.description = data.description
        config.updated_by = admin.id
    return {"key": key, "value": config.value}


@router.get("/users", response_model=list[UserOut])
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User))
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: uuid.UUID,
    data: UserAdminUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.role is not None:
        user.role = data.role
    if data.subscription_tier is not None:
        user.subscription_tier = data.subscription_tier
    if data.is_verified is not None:
        user.is_verified = data.is_verified
    return user


@router.post("/cards", response_model=CardOut, status_code=201)
async def create_card(
    data: CardCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    card = Card(**data.model_dump())
    db.add(card)
    await db.flush()
    return card


@router.put("/cards/{card_id}", response_model=CardOut)
async def update_card(
    card_id: int,
    data: CardUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Card).where(Card.id == card_id))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(card, field, value)
    return card


@router.delete("/cards/{card_id}", status_code=204)
async def delete_card(
    card_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Card).where(Card.id == card_id))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    card.is_active = False  # soft delete
