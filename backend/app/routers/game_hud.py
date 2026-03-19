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
import app.services.persona_engine as pe
import numpy as np

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


@router.get("/traits")
async def get_traits(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Computed persona trait scores [0-1] for the current portfolio.
    Uses persona_engine.compute_traits on the stored persona_vector.
    Falls back to neutral (0.5) values if no vector is set.
    """
    portfolio = await _get_portfolio(current_user, db)
    raw_vector = portfolio.persona_vector  # list[float] | None

    NEUTRAL = {
        "risk_appetite": 0.5,
        "fomo_sensitivity": 0.5,
        "loss_aversion": 0.5,
        "patience": 0.5,
        "diversification_bias": 0.5,
        "overconfidence": 0.5,
    }

    if not raw_vector or len(raw_vector) < pe.DIM_P:
        return {"traits": NEUTRAL, "has_persona": False, "interpretation": "No active persona — neutral defaults shown."}

    p = np.array(raw_vector, dtype=np.float32)
    traits_0_100: dict = pe.compute_traits(p)
    # Normalise [0, 100] → [0, 1] for frontend
    traits_01 = {k: round(v / 100.0, 3) for k, v in traits_0_100.items()}
    interpretation = pe.interpret_persona(traits_0_100)

    return {"traits": traits_01, "has_persona": True, "interpretation": interpretation}
