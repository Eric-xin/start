"""Portfolio router — continuous gameplay, daily income, net worth tracking."""

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from redis.asyncio import Redis

from app.core.dependencies import get_current_active_user
from app.core.redis_client import get_redis
from app.database import get_db
from app.models.card import Card
from app.models.portfolio import UserPortfolio, NetWorthSnapshot, CardPlay
from app.models.user import User
from app.schemas.card import CardOut
from app.schemas.portfolio import (
    PortfolioOut,
    ClaimIncomeResponse,
    PlayCardRequest,
    PlayCardResponse,
    NetWorthSnapshotOut,
    CardPlayOut,
)
from app.services import portfolio_service as svc
from app.services import achievement_service as ach_svc
from app.services.portfolio_service import compute_daily_income, resolve_card
from app.services.card_recommender import recommend_next_card
from app.schemas.achievement import AchievementOut

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


def _achievement_out(a) -> AchievementOut:
    return AchievementOut(
        id=str(a.id),
        key=a.key,
        category=a.category,
        title=a.title,
        description=a.description,
        emoji=a.emoji,
        tier=a.tier,
        condition_type=a.condition_type,
        condition_value=a.condition_value,
        unlocked=True,
    )


def _portfolio_out(portfolio: UserPortfolio) -> PortfolioOut:
    today = date.today()
    can_claim = portfolio.last_income_date != today
    pending = compute_daily_income(portfolio) if can_claim else 0.0
    return PortfolioOut(
        id=str(portfolio.id),
        capital=portfolio.capital,
        net_worth=portfolio.net_worth,
        peak_net_worth=portfolio.peak_net_worth,
        total_income_received=portfolio.total_income_received,
        stage=portfolio.stage,
        investor_rank=portfolio.investor_rank,
        total_cards_played=portfolio.total_cards_played,
        topic_mastery=portfolio.topic_mastery or {},
        portfolio_weights=portfolio.portfolio_weights or {},
        market_state=portfolio.market_state or {},
        last_income_date=portfolio.last_income_date,
        income_streak=portfolio.income_streak,
        persona_id=str(portfolio.persona_id) if portfolio.persona_id else None,
        can_claim_income=can_claim,
        pending_income=pending,
        created_at=portfolio.created_at.isoformat() if portfolio.created_at else "",
        updated_at=portfolio.updated_at.isoformat() if portfolio.updated_at else "",
    )


@router.get("", response_model=PortfolioOut)
async def get_portfolio(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    portfolio = await svc.get_or_create_portfolio(db, current_user.id)
    return _portfolio_out(portfolio)


@router.post("/claim-income", response_model=ClaimIncomeResponse)
async def claim_income(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    portfolio = await svc.get_or_create_portfolio(db, current_user.id)
    amount = await svc.claim_daily_income(db, portfolio)
    if amount is None:
        raise HTTPException(
            status_code=400, detail="Daily income already claimed today."
        )

    progress = await svc.get_or_create_progress(db, current_user.id)
    newly_unlocked = await ach_svc.check_and_unlock(
        db, current_user.id, portfolio, progress
    )
    if newly_unlocked:
        await db.commit()

    return ClaimIncomeResponse(
        amount=amount,
        new_capital=portfolio.capital,
        new_net_worth=portfolio.net_worth,
        streak=portfolio.income_streak,
        message=f"Daily income received: ${amount:,.0f}",
        newly_unlocked_achievements=[_achievement_out(a) for a in newly_unlocked],
    )


@router.post("/play", response_model=PlayCardResponse)
async def play_card(
    body: PlayCardRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    portfolio = await svc.get_or_create_portfolio(db, current_user.id)

    try:
        card_id = uuid.UUID(body.card_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid card_id.")

    result = await db.execute(
        select(Card).where(Card.id == card_id, Card.is_active == True)  # noqa: E712
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    if body.action not in ("left", "right"):
        raise HTTPException(status_code=422, detail="action must be 'left' or 'right'.")

    play_result = await svc.play_card(db, portfolio, card, body.action, redis)

    progress = await svc.get_or_create_progress(db, current_user.id)
    newly_unlocked = await ach_svc.check_and_unlock(
        db, current_user.id, portfolio, progress
    )
    if newly_unlocked:
        await db.commit()

    return PlayCardResponse(
        lesson=play_result["lesson"],
        reward=play_result["reward"],
        is_correct=play_result["is_correct"],
        capital_before=play_result["capital_before"],
        capital_after=play_result["capital_after"],
        net_worth=play_result["net_worth"],
        next_card=play_result["next_card"],
        portfolio=_portfolio_out(play_result["portfolio"]),
        newly_unlocked_achievements=[_achievement_out(a) for a in newly_unlocked],
    )


@router.get("/next-card", response_model=CardOut)
async def get_next_card(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    portfolio = await svc.get_or_create_portfolio(db, current_user.id)
    progress = await svc.get_or_create_progress(db, current_user.id)
    card = await recommend_next_card(
        db,
        portfolio,
        redis,
        enabled_strategies=progress.enabled_strategies,
        enabled_decks=progress.enabled_decks,
    )
    if not card:
        raise HTTPException(status_code=404, detail="No cards available.")
    return resolve_card(card)


@router.get("/history", response_model=list[NetWorthSnapshotOut])
async def get_net_worth_history(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    portfolio = await svc.get_or_create_portfolio(db, current_user.id)
    result = await db.execute(
        select(NetWorthSnapshot)
        .where(NetWorthSnapshot.portfolio_id == portfolio.id)
        .order_by(NetWorthSnapshot.snapshot_date.asc())
    )
    return [
        NetWorthSnapshotOut(
            id=str(s.id),
            net_worth=s.net_worth,
            capital=s.capital,
            snapshot_date=s.snapshot_date,
            created_at=s.created_at.isoformat() if s.created_at else "",
        )
        for s in result.scalars().all()
    ]


@router.get("/recent-plays", response_model=list[CardPlayOut])
async def get_recent_plays(
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    portfolio = await svc.get_or_create_portfolio(db, current_user.id)
    result = await db.execute(
        select(CardPlay)
        .where(CardPlay.portfolio_id == portfolio.id)
        .options(selectinload(CardPlay.card))
        .order_by(CardPlay.created_at.desc())
        .limit(limit)
    )
    return [
        CardPlayOut(
            id=str(p.id),
            action=p.action,
            reward=p.reward,
            capital_before=p.capital_before,
            capital_after=p.capital_after,
            created_at=p.created_at.isoformat() if p.created_at else "",
            card=CardOut.model_validate(p.card) if p.card else None,
        )
        for p in result.scalars().all()
    ]
