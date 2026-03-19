import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.user import User, UserRole, SubscriptionTier
from app.models.card import Card
from app.models.game import GameConfig
from app.models.portfolio import UserPortfolio, CardPlay
from app.models.progress import UserProgress, STRATEGY_META, DECK_META
from app.schemas.user import UserOut
from app.schemas.card import CardOut, CardCreate, CardUpdate
from app.core.dependencies import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ─── Pydantic schemas ────────────────────────────────────────────────────────

class ConfigPatch(BaseModel):
    value: dict | list | float | str | int
    description: str | None = None


class UserAdminUpdate(BaseModel):
    role: UserRole | None = None
    subscription_tier: SubscriptionTier | None = None
    is_verified: bool | None = None


class PortfolioAdminOut(BaseModel):
    model_config = {"from_attributes": False}
    user_id: str
    username: str
    email: str
    capital: float
    net_worth: float
    peak_net_worth: float
    stage: int
    investor_rank: int
    total_cards_played: int
    income_streak: int
    created_at: str


class PortfolioAdminUpdate(BaseModel):
    capital: Optional[float] = None
    net_worth: Optional[float] = None
    peak_net_worth: Optional[float] = None
    stage: Optional[int] = None
    investor_rank: Optional[int] = None
    income_streak: Optional[int] = None


class ProgressAdminOut(BaseModel):
    model_config = {"from_attributes": False}
    user_id: str
    username: str
    email: str
    unlocked_strategies: list
    enabled_strategies: list
    unlocked_decks: list
    enabled_decks: list
    total_cards_played: int


class ProgressAdminUpdate(BaseModel):
    unlocked_strategies: Optional[list] = None
    enabled_strategies: Optional[list] = None
    unlocked_decks: Optional[list] = None
    enabled_decks: Optional[list] = None


class StatsOut(BaseModel):
    total_users: int
    total_portfolios: int
    total_cards_played: int
    total_capital: float
    active_cards: int


# ─── Stats ───────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsOut)
async def get_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    total_portfolios = (await db.execute(select(func.count(UserPortfolio.id)))).scalar_one()

    cards_sum = (await db.execute(
        select(func.coalesce(func.sum(UserPortfolio.total_cards_played), 0))
    )).scalar_one()
    capital_sum = (await db.execute(
        select(func.coalesce(func.sum(UserPortfolio.capital), 0.0))
    )).scalar_one()
    active_cards = (await db.execute(
        select(func.count(Card.id)).where(Card.is_active == True)
    )).scalar_one()

    return StatsOut(
        total_users=total_users,
        total_portfolios=total_portfolios,
        total_cards_played=int(cards_sum),
        total_capital=float(capital_sum),
        active_cards=active_cards,
    )


# ─── Config ──────────────────────────────────────────────────────────────────

@router.get("/config")
async def get_config(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GameConfig))
    configs = result.scalars().all()
    return {c.key: {"value": c.value, "description": c.description} for c in configs}


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
        if data.description is not None:
            config.description = data.description
        config.updated_by = admin.id
    await db.flush()
    return {"key": key, "value": config.value, "description": config.description}


@router.delete("/config/{key}", status_code=204)
async def delete_config(
    key: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GameConfig).where(GameConfig.key == key))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Config key not found")
    await db.delete(config)


# ─── Users ───────────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserOut])
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
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
    await db.flush()
    return user


# ─── Portfolios ──────────────────────────────────────────────────────────────

@router.get("/portfolios", response_model=list[PortfolioAdminOut])
async def list_portfolios(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserPortfolio, User.username, User.email)
        .join(User, User.id == UserPortfolio.user_id)
        .order_by(UserPortfolio.net_worth.desc())
    )
    rows = result.all()
    return [
        PortfolioAdminOut(
            user_id=str(p.id),
            username=username,
            email=email,
            capital=p.capital,
            net_worth=p.net_worth,
            peak_net_worth=p.peak_net_worth,
            stage=p.stage,
            investor_rank=p.investor_rank,
            total_cards_played=p.total_cards_played,
            income_streak=p.income_streak,
            created_at=p.created_at.isoformat(),
        )
        for p, username, email in rows
    ]


@router.patch("/portfolios/{user_id}", response_model=PortfolioAdminOut)
async def update_portfolio(
    user_id: uuid.UUID,
    data: PortfolioAdminUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    port_result = await db.execute(
        select(UserPortfolio).where(UserPortfolio.user_id == user_id)
    )
    portfolio = port_result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    if data.capital is not None:
        portfolio.capital = data.capital
    if data.net_worth is not None:
        portfolio.net_worth = data.net_worth
    if data.peak_net_worth is not None:
        portfolio.peak_net_worth = data.peak_net_worth
    if data.stage is not None:
        portfolio.stage = max(1, min(5, data.stage))
    if data.investor_rank is not None:
        portfolio.investor_rank = max(1, min(4, data.investor_rank))
    if data.income_streak is not None:
        portfolio.income_streak = max(0, data.income_streak)

    await db.flush()
    return PortfolioAdminOut(
        user_id=str(portfolio.id),
        username=user.username,
        email=user.email,
        capital=portfolio.capital,
        net_worth=portfolio.net_worth,
        peak_net_worth=portfolio.peak_net_worth,
        stage=portfolio.stage,
        investor_rank=portfolio.investor_rank,
        total_cards_played=portfolio.total_cards_played,
        income_streak=portfolio.income_streak,
        created_at=portfolio.created_at.isoformat(),
    )


# ─── Progress / Decks ────────────────────────────────────────────────────────

@router.get("/progress", response_model=list[ProgressAdminOut])
async def list_progress(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserProgress, User.username, User.email)
        .join(User, User.id == UserProgress.user_id)
        .order_by(User.username)
    )
    rows = result.all()
    return [
        ProgressAdminOut(
            user_id=str(p.user_id),
            username=username,
            email=email,
            unlocked_strategies=p.unlocked_strategies or [],
            enabled_strategies=p.enabled_strategies or [],
            unlocked_decks=p.unlocked_decks or [],
            enabled_decks=p.enabled_decks or [],
            total_cards_played=p.total_cards_played,
        )
        for p, username, email in rows
    ]


@router.patch("/progress/{user_id}", response_model=ProgressAdminOut)
async def update_progress(
    user_id: uuid.UUID,
    data: ProgressAdminUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    prog_result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )
    progress = prog_result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    if data.unlocked_strategies is not None:
        progress.unlocked_strategies = data.unlocked_strategies
    if data.enabled_strategies is not None:
        progress.enabled_strategies = data.enabled_strategies
    if data.unlocked_decks is not None:
        progress.unlocked_decks = data.unlocked_decks
    if data.enabled_decks is not None:
        progress.enabled_decks = data.enabled_decks

    await db.flush()
    return ProgressAdminOut(
        user_id=str(progress.user_id),
        username=user.username,
        email=user.email,
        unlocked_strategies=progress.unlocked_strategies or [],
        enabled_strategies=progress.enabled_strategies or [],
        unlocked_decks=progress.unlocked_decks or [],
        enabled_decks=progress.enabled_decks or [],
        total_cards_played=progress.total_cards_played,
    )


# ─── Cards ───────────────────────────────────────────────────────────────────

@router.get("/cards", response_model=list[CardOut])
async def list_cards(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Card).order_by(Card.stage_min, Card.card_id))
    return result.scalars().all()


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
    card_id: uuid.UUID,
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
    await db.flush()
    return card


@router.delete("/cards/{card_id}", status_code=204)
async def delete_card(
    card_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Card).where(Card.id == card_id))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    card.is_active = False  # soft delete
