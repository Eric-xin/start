"""
Market data ingestion script.

Downloads daily adjusted close prices via yfinance, stores them in the
market_assets and market_prices tables, and seeds the market_events table.

Usage:
    cd backend && conda run -n cardecon python scripts/ingest_market_data.py
"""
from __future__ import annotations

import asyncio
import os
import sys
import uuid
from datetime import date, datetime
from pathlib import Path

# Allow importing from the backend app package
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd
import yfinance as yf
from dotenv import load_dotenv
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://cardecon:cardecon_dev@localhost:5432/cardecon",
)

# ---------------------------------------------------------------------------
# Asset definitions
# ---------------------------------------------------------------------------

ASSETS = [
    {
        "ticker": "SPY",
        "name": "S&P 500 ETF",
        "asset_class": "stocks",
        "description": "SPDR S&P 500 ETF — tracks the 500 largest US companies",
    },
    {
        "ticker": "AGG",
        "name": "US Aggregate Bond ETF",
        "asset_class": "bonds",
        "description": "iShares Core US Aggregate Bond ETF — investment-grade bonds",
    },
    {
        "ticker": "GLD",
        "name": "Gold ETF",
        "asset_class": "gold",
        "description": "SPDR Gold Shares — physically-backed gold exposure",
    },
    {
        "ticker": "BTC-USD",
        "name": "Bitcoin",
        "asset_class": "bitcoin",
        "description": "Bitcoin price in USD — the original cryptocurrency",
    },
    {
        "ticker": "QQQ",
        "name": "Nasdaq 100 ETF",
        "asset_class": "tech",
        "description": "Invesco QQQ — tracks top 100 Nasdaq technology stocks",
    },
]

START_DATE = "2021-01-01"
END_DATE = "2026-03-01"

# ---------------------------------------------------------------------------
# Market events (hardcoded seed data)
# ---------------------------------------------------------------------------

MARKET_EVENTS = [
    {
        "date": "2021-01-27",
        "label": "GameStop Short Squeeze",
        "impact": "neutral",
        "description": "Retail investors on Reddit drive GME from CHF20 to CHF483, triggering hedge fund losses and market volatility.",
        "affected_assets": ["stocks"],
    },
    {
        "date": "2021-02-21",
        "label": "Bitcoin Hits CHF58K ATH",
        "impact": "positive",
        "description": "Bitcoin reaches new all-time high of CHF58,000, driven by institutional adoption (Tesla, MicroStrategy).",
        "affected_assets": ["bitcoin"],
    },
    {
        "date": "2021-05-19",
        "label": "Crypto Crash -50%",
        "impact": "negative",
        "description": "Bitcoin drops 50% from ATH. China bans crypto mining, Elon Musk reverses Tesla BTC stance. Alt-coins down 70-80%.",
        "affected_assets": ["bitcoin"],
    },
    {
        "date": "2021-11-10",
        "label": "Bitcoin ATH CHF69K + S&P ATH",
        "impact": "positive",
        "description": "Bitcoin reaches all-time high of CHF69,000. S&P 500 also at record highs. Market exuberance peak.",
        "affected_assets": ["bitcoin", "stocks", "tech"],
    },
    {
        "date": "2022-01-05",
        "label": "Fed Rate Hike Signals",
        "impact": "negative",
        "description": "Fed minutes signal faster rate hikes than expected. Tech stocks begin major selloff. NASDAQ down 5% in a week.",
        "affected_assets": ["tech", "stocks", "bonds"],
    },
    {
        "date": "2022-02-24",
        "label": "Russia Invades Ukraine",
        "impact": "negative",
        "description": "Russia launches full-scale invasion. Oil spikes to CHF130/barrel. European markets crash. Gold surges as safe haven.",
        "affected_assets": ["stocks", "gold", "bonds"],
    },
    {
        "date": "2022-03-16",
        "label": "Fed First Rate Hike",
        "impact": "negative",
        "description": "Federal Reserve raises rates for first time since 2018, +25bps. Beginning of most aggressive tightening cycle in 40 years.",
        "affected_assets": ["bonds", "stocks", "tech"],
    },
    {
        "date": "2022-05-11",
        "label": "Luna/UST Collapse",
        "impact": "negative",
        "description": "Terra Luna and UST stablecoin collapse to zero, wiping out CHF60B. Contagion spreads across entire crypto market.",
        "affected_assets": ["bitcoin"],
    },
    {
        "date": "2022-06-13",
        "label": "Bear Market Confirmed",
        "impact": "negative",
        "description": "S&P 500 enters official bear market (>20% decline). Bitcoin falls below CHF20K. Fed accelerates hikes to fight 9% inflation.",
        "affected_assets": ["stocks", "tech", "bitcoin", "bonds"],
    },
    {
        "date": "2022-09-23",
        "label": "UK Pension Crisis",
        "impact": "negative",
        "description": "UK mini-budget triggers gilt market crisis. Bank of England emergency bond buying. Pound hits record low vs dollar.",
        "affected_assets": ["bonds", "stocks"],
    },
    {
        "date": "2022-11-11",
        "label": "FTX Collapse",
        "impact": "negative",
        "description": "FTX crypto exchange collapses, CEO Sam Bankman-Fried arrested. Bitcoin falls 25% in a week. Crypto winter deepens.",
        "affected_assets": ["bitcoin"],
    },
    {
        "date": "2023-03-10",
        "label": "Silicon Valley Bank Collapse",
        "impact": "negative",
        "description": "SVB bank run causes largest US bank failure since 2008. Contagion to Signature Bank. Fed creates emergency lending program.",
        "affected_assets": ["stocks", "bonds", "bitcoin"],
    },
    {
        "date": "2023-07-26",
        "label": "Fed Peaks at 5.25-5.5%",
        "impact": "positive",
        "description": "Fed raises rates to 5.25-5.5%, signaling near end of hiking cycle. Markets rally on pivot hopes. S&P up 20% from lows.",
        "affected_assets": ["stocks", "tech", "bonds"],
    },
    {
        "date": "2023-10-07",
        "label": "Israel-Hamas War",
        "impact": "negative",
        "description": "Hamas attack on Israel triggers conflict. Oil spikes briefly. Safe haven assets (gold, bonds) see modest inflows.",
        "affected_assets": ["gold", "bonds", "stocks"],
    },
    {
        "date": "2024-01-10",
        "label": "Bitcoin Spot ETF Approved",
        "impact": "positive",
        "description": "SEC approves first Bitcoin spot ETFs (BlackRock, Fidelity). Institutional floodgates open. Bitcoin surges 15% in days.",
        "affected_assets": ["bitcoin"],
    },
    {
        "date": "2024-03-14",
        "label": "Bitcoin ATH CHF73K",
        "impact": "positive",
        "description": "Bitcoin hits new all-time high of CHF73,000 ahead of April halving. Crypto market cap exceeds CHF2.5 trillion.",
        "affected_assets": ["bitcoin"],
    },
    {
        "date": "2024-07-16",
        "label": "S&P 500 ATH 5,667",
        "impact": "positive",
        "description": "S&P 500 reaches all-time high driven by AI boom (Nvidia +200% YTD) and soft-landing optimism.",
        "affected_assets": ["stocks", "tech"],
    },
    {
        "date": "2024-08-05",
        "label": "Yen Carry Trade Unwind",
        "impact": "negative",
        "description": "Bank of Japan rate hike triggers unwinding of massive yen carry trades. Global equity markets drop 5-10% in single day.",
        "affected_assets": ["stocks", "tech", "bitcoin"],
    },
    {
        "date": "2024-09-18",
        "label": "Fed Cuts Rates -50bps",
        "impact": "positive",
        "description": "Federal Reserve cuts rates by 50bps, starting new easing cycle. Markets rally. 2-year bond yields drop sharply.",
        "affected_assets": ["bonds", "stocks", "tech"],
    },
    {
        "date": "2024-11-06",
        "label": "Trump Election Victory",
        "impact": "positive",
        "description": "Trump wins presidential election. Markets surge: S&P +2.5%, Bitcoin +10%, bank stocks +10%. Bonds sell off sharply.",
        "affected_assets": ["stocks", "bitcoin", "tech", "bonds"],
    },
    {
        "date": "2025-01-27",
        "label": "DeepSeek AI Shock",
        "impact": "negative",
        "description": "Chinese AI lab DeepSeek releases R1, matching GPT-4 at fraction of cost. Nvidia falls -17% in single day. AI bubble concerns.",
        "affected_assets": ["tech", "stocks"],
    },
    {
        "date": "2025-02-03",
        "label": "Tariff Wars Begin",
        "impact": "negative",
        "description": "Trump announces 25% tariffs on Canada/Mexico, 10% on China. Retaliatory tariffs follow. Global trade uncertainty spikes.",
        "affected_assets": ["stocks", "tech", "gold"],
    },
    {
        "date": "2025-03-04",
        "label": "Trade War Escalates",
        "impact": "negative",
        "description": "Tariff escalation continues. S&P 500 enters correction (-10%). Gold hits CHF2,900 as safe haven demand surges.",
        "affected_assets": ["stocks", "tech", "gold"],
    },
]

# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

async def upsert_asset(db: AsyncSession, asset_data: dict) -> "MarketAsset":  # type: ignore[return]
    """Insert asset if not exists; return the row."""
    # Import here to ensure models are registered
    from app.models.market import MarketAsset

    result = await db.execute(
        select(MarketAsset).where(MarketAsset.ticker == asset_data["ticker"])
    )
    existing = result.scalar_one_or_none()
    if existing:
        print(f"  Asset {asset_data['ticker']} already exists — skipping insert")
        return existing

    asset = MarketAsset(
        id=uuid.uuid4(),
        ticker=asset_data["ticker"],
        name=asset_data["name"],
        asset_class=asset_data["asset_class"],
        description=asset_data["description"],
        is_active=True,
    )
    db.add(asset)
    await db.flush()
    print(f"  Inserted asset: {asset_data['ticker']}")
    return asset


async def upsert_prices(db: AsyncSession, asset: "MarketAsset", df: pd.DataFrame) -> int:  # type: ignore[return]
    """
    Upsert price rows for a given asset.
    Returns count of newly inserted rows.
    """
    from app.models.market import MarketPrice

    if df.empty:
        print(f"  No price data for {asset.ticker}")
        return 0

    # Fetch existing dates for this asset
    result = await db.execute(
        select(MarketPrice.date).where(MarketPrice.asset_id == asset.id)
    )
    existing_dates = {row[0] for row in result.fetchall()}

    inserted = 0
    for row_date, close_price in df.items():
        d = row_date.date() if hasattr(row_date, "date") else row_date
        if d in existing_dates:
            continue
        if pd.isna(close_price) or close_price <= 0:
            continue

        price_row = MarketPrice(
            id=uuid.uuid4(),
            asset_id=asset.id,
            date=d,
            close=float(close_price),
            daily_return=None,  # filled in after bulk insert
        )
        db.add(price_row)
        inserted += 1

    await db.flush()
    return inserted


async def compute_daily_returns(db: AsyncSession, asset: "MarketAsset") -> None:
    """
    Compute daily_return for all price rows of this asset where it is NULL.
    Uses a window function approach via raw SQL for efficiency.
    """
    await db.execute(
        text("""
        UPDATE market_prices mp
        SET daily_return = sub.ret
        FROM (
            SELECT
                id,
                (close - LAG(close) OVER (
                    PARTITION BY asset_id ORDER BY date
                )) / NULLIF(LAG(close) OVER (
                    PARTITION BY asset_id ORDER BY date
                ), 0) AS ret
            FROM market_prices
            WHERE asset_id = :asset_id
        ) sub
        WHERE mp.id = sub.id
          AND sub.ret IS NOT NULL
        """),
        {"asset_id": str(asset.id)},
    )


async def seed_events(db: AsyncSession) -> None:
    """Seed market_events table. Skip events that already exist by label+date."""
    from app.models.market import MarketEvent

    for ev in MARKET_EVENTS:
        ev_date = date.fromisoformat(ev["date"])
        result = await db.execute(
            select(MarketEvent).where(
                MarketEvent.label == ev["label"],
                MarketEvent.date == ev_date,
            )
        )
        if result.scalar_one_or_none() is not None:
            continue

        event = MarketEvent(
            id=uuid.uuid4(),
            date=ev_date,
            label=ev["label"],
            description=ev["description"],
            impact=ev["impact"],
            affected_assets=ev.get("affected_assets", []),
        )
        db.add(event)

    await db.flush()
    print(f"  Seeded {len(MARKET_EVENTS)} market events (skipping existing)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main() -> None:
    print("=== MarketHand Market Data Ingestion ===")
    print(f"Database: {DATABASE_URL}")
    print(f"Date range: {START_DATE} → {END_DATE}")
    print()

    # We need to import models so Base.metadata knows about them
    # This also ensures create_all works
    import app.models.user    # noqa: F401
    import app.models.card    # noqa: F401
    import app.models.game    # noqa: F401
    import app.models.persona # noqa: F401
    import app.models.progress # noqa: F401
    import app.models.portfolio # noqa: F401
    import app.models.market  # noqa: F401
    from app.database import Base

    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        expire_on_commit=False,
    )

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Tables ensured.\n")

    # --- Download price data ---
    print(f"Downloading prices from yfinance ({START_DATE} to {END_DATE})...")
    tickers = [a["ticker"] for a in ASSETS]
    try:
        raw = yf.download(
            tickers=tickers,
            start=START_DATE,
            end=END_DATE,
            auto_adjust=True,
            progress=True,
            group_by="ticker",
        )
    except Exception as e:
        print(f"ERROR downloading data: {e}")
        raw = None

    # Build per-ticker DataFrames
    ticker_data: dict[str, pd.Series] = {}
    if raw is not None and not raw.empty:
        if len(tickers) == 1:
            # Single ticker: flat columns
            close = raw.get("Close")
            if close is not None:
                ticker_data[tickers[0]] = close.dropna()
        else:
            for ticker in tickers:
                try:
                    if hasattr(raw.columns, "levels"):
                        # MultiIndex
                        if ticker in raw.columns.get_level_values(0):
                            close = raw[ticker]["Close"].dropna()
                        elif ticker in raw.columns.get_level_values(1):
                            close = raw["Close"][ticker].dropna()
                        else:
                            print(f"  WARNING: No data found for {ticker}")
                            continue
                    else:
                        close = raw[ticker]["Close"].dropna()
                    ticker_data[ticker] = close
                except (KeyError, TypeError) as e:
                    print(f"  WARNING: Could not extract {ticker} data: {e}")
    else:
        print("WARNING: yfinance returned no data. Trying individual downloads...")
        for ticker in tickers:
            try:
                df = yf.download(ticker, start=START_DATE, end=END_DATE, auto_adjust=True, progress=False)
                if df is not None and not df.empty and "Close" in df.columns:
                    ticker_data[ticker] = df["Close"].dropna()
                    print(f"  {ticker}: {len(ticker_data[ticker])} rows")
                else:
                    print(f"  WARNING: No data for {ticker}")
            except Exception as e:
                print(f"  WARNING: Failed to download {ticker}: {e}")

    print()

    # --- Upsert to DB ---
    async with AsyncSessionLocal() as db:
        try:
            # Seed events first
            print("Seeding market events...")
            await seed_events(db)
            await db.commit()
            print()

            # Upsert each asset + its prices
            total_inserted = 0
            for asset_def in ASSETS:
                ticker = asset_def["ticker"]
                print(f"Processing {ticker}...")

                asset = await upsert_asset(db, asset_def)

                price_series = ticker_data.get(ticker)
                if price_series is None or len(price_series) == 0:
                    print(f"  WARNING: No price data for {ticker} — skipping prices")
                    await db.commit()
                    continue

                print(f"  {len(price_series)} daily prices downloaded")
                n_inserted = await upsert_prices(db, asset, price_series)
                print(f"  {n_inserted} new rows inserted")
                total_inserted += n_inserted

                await db.commit()

                # Compute daily returns
                print(f"  Computing daily returns for {ticker}...")
                await compute_daily_returns(db, asset)
                await db.commit()
                print(f"  Done.")

            print(f"\nTotal price rows inserted: {total_inserted}")

        except Exception as e:
            await db.rollback()
            print(f"\nERROR during ingestion: {e}")
            raise

    await engine.dispose()
    print("\n=== Ingestion complete ===")


if __name__ == "__main__":
    asyncio.run(main())
