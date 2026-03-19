"""Game HUD endpoints — synthetic market overview, asset detail, and news feed."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.portfolio import UserPortfolio
from app.models.user import User
from app.services.market_synthesizer import (
    build_market_overview,
    build_asset_detail,
    categories_from_market_state,
    ASSET_BY_TICKER,
)
from app.services.news_service import generate_news_feed

router = APIRouter(prefix="/api/hud", tags=["hud"])


async def _get_portfolio(user: User, db: AsyncSession) -> UserPortfolio:
    result = await db.execute(
        select(UserPortfolio).where(UserPortfolio.user_id == user.id)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio


@router.get("/market")
async def get_market_overview(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Synthetic market overview driven by the player's current market_state.
    Returns sparklines (30 days) and return metrics for all 5 assets.
    """
    portfolio = await _get_portfolio(current_user, db)
    ms = portfolio.market_state or {}
    portfolio_id = str(portfolio.id)

    assets = build_market_overview(portfolio_id, ms)

    return {
        "assets": assets,
        "market_state": ms,
        "as_of": "LIVE",
    }


@router.get("/market/{ticker}")
async def get_asset_detail(
    ticker: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    90-day synthetic price series + interpretation for one asset.
    """
    ticker = ticker.upper()
    if ticker not in ASSET_BY_TICKER:
        raise HTTPException(status_code=404, detail=f"Unknown ticker: {ticker}")

    portfolio = await _get_portfolio(current_user, db)
    ms = portfolio.market_state or {}
    portfolio_id = str(portfolio.id)

    detail = build_asset_detail(ticker, portfolio_id, ms)
    return detail


@router.get("/news")
async def get_news_feed(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Template-based news feed derived from the player's current market_state.
    Categories are selected by which market dimensions are most active.
    """
    portfolio = await _get_portfolio(current_user, db)
    ms = portfolio.market_state or {}

    # Derive relevant template categories from market_state
    categories = categories_from_market_state(ms)

    # Build fake "upcoming events" using the top categories so generate_news_feed
    # prioritises them — no real MarketEvent table needed.
    fake_events = [
        {"label": cat, "description": "", "impact": "negative" if "crash" in cat or "recession" in cat else "positive"}
        for cat in categories[:6]
    ]

    news = generate_news_feed(fake_events, count=8)
    return {"items": news, "market_state": ms}
