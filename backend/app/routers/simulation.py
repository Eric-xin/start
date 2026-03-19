"""Simulation router — market simulation endpoints."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.models.market import MarketAsset, MarketPrice, MarketEvent
from app.models.portfolio import UserPortfolio
from app.models.user import User
from app.schemas.simulation import (
    AssetInfo,
    EventAnnotation,
    SimulationRequest,
    SimulationResponse,
)
from app.services.simulation_engine import run_simulation

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.get("/assets", response_model=list[AssetInfo])
async def list_assets(db: AsyncSession = Depends(get_db)) -> list[AssetInfo]:
    """
    Return all active market assets with a data_available flag.
    Public — no auth required.
    """
    result = await db.execute(
        select(MarketAsset).where(MarketAsset.is_active == True).order_by(MarketAsset.ticker)
    )
    asset_rows = result.scalars().all()

    # Check which assets have price data
    if asset_rows:
        asset_ids = [a.id for a in asset_rows]
        count_result = await db.execute(
            select(MarketPrice.asset_id, func.count(MarketPrice.id).label("cnt"))
            .where(MarketPrice.asset_id.in_(asset_ids))
            .group_by(MarketPrice.asset_id)
        )
        counts = {row.asset_id: row.cnt for row in count_result}
    else:
        counts = {}

    return [
        AssetInfo(
            id=str(asset.id),
            ticker=asset.ticker,
            name=asset.name,
            asset_class=asset.asset_class,
            description=asset.description,
            data_available=counts.get(asset.id, 0) > 0,
        )
        for asset in asset_rows
    ]


@router.get("/events", response_model=list[EventAnnotation])
async def list_events(
    start: date | None = Query(None, description="Start date (YYYY-MM-DD)"),
    end: date | None = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
) -> list[EventAnnotation]:
    """
    Return all market events, optionally filtered by date range.
    Public — no auth required.
    """
    query = select(MarketEvent).order_by(MarketEvent.date)
    if start is not None:
        query = query.where(MarketEvent.date >= start)
    if end is not None:
        query = query.where(MarketEvent.date <= end)

    result = await db.execute(query)
    events = result.scalars().all()

    return [
        EventAnnotation(
            date=ev.date.isoformat(),
            label=ev.label,
            impact=ev.impact,
        )
        for ev in events
    ]


@router.post("/run", response_model=SimulationResponse)
async def run_simulation_endpoint(
    request: SimulationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> SimulationResponse:
    """
    Run a persona-driven market simulation.

    - If persona_vector is None in the request, loads the user's portfolio persona_vector.
    - Requires authentication.
    """
    # Load user's portfolio if persona_vector not provided
    user_portfolio: UserPortfolio | None = None
    if request.persona_vector is None:
        port_result = await db.execute(
            select(UserPortfolio).where(UserPortfolio.user_id == current_user.id)
        )
        user_portfolio = port_result.scalar_one_or_none()

    return await run_simulation(db, request, user_portfolio)


@router.get("/market-summary")
async def market_summary(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Return latest prices and 1-year returns for each active asset.
    Suitable for dashboard display. Public — no auth required.
    """
    result = await db.execute(
        select(MarketAsset).where(MarketAsset.is_active == True).order_by(MarketAsset.ticker)
    )
    assets = result.scalars().all()

    if not assets:
        return {"assets": []}

    summary = []
    for asset in assets:
        # Latest price
        latest_result = await db.execute(
            select(MarketPrice)
            .where(MarketPrice.asset_id == asset.id)
            .order_by(MarketPrice.date.desc())
            .limit(1)
        )
        latest = latest_result.scalar_one_or_none()

        # Price ~1 year ago (252 trading days ≈ 52 weeks — use 365 days back)
        one_year_result = None
        one_year_return = None
        if latest is not None:
            one_yr_ago = date(latest.date.year - 1, latest.date.month, latest.date.day)
            yr_result = await db.execute(
                select(MarketPrice)
                .where(
                    MarketPrice.asset_id == asset.id,
                    MarketPrice.date >= one_yr_ago,
                )
                .order_by(MarketPrice.date.asc())
                .limit(1)
            )
            one_year_price_row = yr_result.scalar_one_or_none()
            if one_year_price_row and one_year_price_row.close > 0:
                one_year_return = (latest.close - one_year_price_row.close) / one_year_price_row.close

        summary.append({
            "ticker": asset.ticker,
            "name": asset.name,
            "asset_class": asset.asset_class,
            "latest_price": latest.close if latest else None,
            "latest_date": latest.date.isoformat() if latest else None,
            "one_year_return": one_year_return,
        })

    return {"assets": summary}
