"""
Persona-driven market simulation engine.

Algorithm:
1. Load monthly price data for selected assets from DB
2. Compute persona traits from persona_vector
3. For each monthly step:
   a. Compute target allocation (base + persona adjustments)
   b. Apply momentum overlay (fomo_sensitivity)
   c. Apply drawdown protection (loss_aversion)
   d. Decide whether to rebalance (patience controls frequency)
   e. If rebalancing: compute trades, apply 0.1% transaction cost
4. Return full history + trades + metrics
"""
from __future__ import annotations

import math
from datetime import date
from typing import Any

import numpy as np
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import app.models.persona  # noqa: F401 — register Persona with SQLAlchemy mapper
from app.models.market import MarketAsset, MarketPrice, MarketEvent
from app.models.portfolio import UserPortfolio
from app.schemas.simulation import (
    SimulationRequest,
    SimulationResponse,
    PortfolioPoint,
    TradeRecord,
    EventAnnotation,
    SimulationMetrics,
)
from app.services.persona_engine import compute_traits

# ---------------------------------------------------------------------------
# Allocation helpers
# ---------------------------------------------------------------------------

# Base allocation anchors per asset class (at neutral risk_appetite=50)
# These are scaled by trait values at runtime.
_BASE_WEIGHTS = {
    "stocks": 0.35,
    "bonds": 0.30,
    "gold": 0.10,
    "bitcoin": 0.05,
    "tech": 0.20,
}

# Safe-haven asset classes (used for defensive shifts)
_SAFE_HAVENS = {"bonds", "gold"}
# Risk asset classes
_RISK_ASSETS = {"stocks", "tech", "bitcoin"}


def _normalize(alloc: dict[str, float]) -> dict[str, float]:
    """Normalize allocation weights to sum exactly to 1.0."""
    total = sum(alloc.values())
    if total <= 0:
        n = len(alloc)
        return {k: 1.0 / n for k in alloc}
    return {k: v / total for k, v in alloc.items()}


def compute_base_allocation(traits: dict[str, float], asset_classes: list[str]) -> dict[str, float]:
    """
    Compute base portfolio allocation driven by risk_appetite, loss_aversion,
    and diversification_bias.

    - risk_appetite 0→100 shifts stocks from ~25% to ~55%, bonds from ~45% to ~20%
    - loss_aversion boosts gold + bonds, reduces bitcoin
    - diversification_bias clamps max single weight (low=70% max, high=30% max)
    - Available assets only; always normalizes to sum=1.0
    """
    ra = traits["risk_appetite"] / 100.0       # 0.0 → 1.0
    la = traits["loss_aversion"] / 100.0
    db = traits["diversification_bias"] / 100.0

    # Start from neutral anchors for available asset classes only
    alloc: dict[str, float] = {}
    for ac in asset_classes:
        alloc[ac] = _BASE_WEIGHTS.get(ac, 0.10)

    # --- Risk appetite shift ---
    # stocks: 0.25 at ra=0, 0.55 at ra=1
    # bonds: 0.45 at ra=0, 0.20 at ra=1
    # tech: 0.10 at ra=0, 0.25 at ra=1
    # bitcoin: 0.01 at ra=0, 0.10 at ra=1
    ra_adjustments = {
        "stocks": -0.10 + 0.30 * ra,    # -0.10 at ra=0, +0.20 at ra=1
        "bonds": 0.15 - 0.25 * ra,      # +0.15 at ra=0, -0.10 at ra=1
        "tech": -0.10 + 0.15 * ra,      # -0.10 at ra=0, +0.05 at ra=1
        "bitcoin": -0.04 + 0.09 * ra,   # -0.04 at ra=0, +0.05 at ra=1
        "gold": 0.00,
    }
    for ac in alloc:
        alloc[ac] = max(0.0, alloc[ac] + ra_adjustments.get(ac, 0.0))

    # --- Loss aversion shift: boosts bonds/gold, cuts bitcoin ---
    la_adjustments = {
        "bonds": 0.10 * la,
        "gold": 0.08 * la,
        "bitcoin": -0.06 * la,
        "stocks": -0.05 * la,
        "tech": -0.05 * la,
    }
    for ac in alloc:
        alloc[ac] = max(0.0, alloc[ac] + la_adjustments.get(ac, 0.0))

    # --- Diversification bias: clamp max weight ---
    # db=0 → max weight 70%; db=1 → max weight 30%
    max_weight = 0.70 - 0.40 * db
    for ac in alloc:
        alloc[ac] = min(alloc[ac], max_weight)

    # Normalize
    return _normalize(alloc)


def apply_momentum_overlay(
    base_alloc: dict[str, float],
    momentum_3m: dict[str, float],
    traits: dict[str, float],
) -> dict[str, float]:
    """
    Apply momentum chasing / cutting based on fomo_sensitivity and loss_aversion.

    - fomo_sensitivity drives chasing: if 3-month return > 8%, increase by fomo*0.08
    - loss_aversion drives cutting: if 3-month return < -8%, reduce by la*0.08
    - Compensating moves always go to/from bonds (or first safe haven available)
    - Normalizes after adjustments
    """
    fomo = traits["fomo_sensitivity"] / 100.0
    la = traits["loss_aversion"] / 100.0

    alloc = dict(base_alloc)

    # Find the bond/safe-haven to use as buffer
    buffer_asset = None
    for safe in ("bonds", "gold"):
        if safe in alloc:
            buffer_asset = safe
            break
    if buffer_asset is None:
        # No safe haven available — normalize and return as-is
        return _normalize(alloc)

    for asset, ret in momentum_3m.items():
        if asset not in alloc or asset == buffer_asset:
            continue

        if ret > 0.08:
            # Strong momentum up → FOMO drives increase
            delta = fomo * 0.08 * min(ret / 0.08, 2.0)  # scale with strength, cap at 2x
            delta = min(delta, alloc.get(buffer_asset, 0.0))  # can't take more than buffer has
            alloc[asset] = alloc[asset] + delta
            alloc[buffer_asset] = max(0.0, alloc[buffer_asset] - delta)

        elif ret < -0.08:
            # Sharp drawdown → loss aversion drives reduction
            delta = la * 0.08 * min(abs(ret) / 0.08, 2.0)
            delta = min(delta, alloc[asset])  # can't go below zero
            alloc[asset] = max(0.0, alloc[asset] - delta)
            alloc[buffer_asset] = alloc.get(buffer_asset, 0.0) + delta

    return _normalize(alloc)


def apply_drawdown_protection(
    alloc: dict[str, float],
    portfolio_drawdown_pct: float,
    traits: dict[str, float],
) -> dict[str, float]:
    """
    If drawdown exceeds 5%, shift risk assets to bonds/gold.

    - Scaled by loss_aversion
    - overconfidence dampens the response (high overconfidence ignores drawdown)
    - portfolio_drawdown_pct is a positive number (absolute value of negative drawdown)
    """
    if portfolio_drawdown_pct < 0.05:
        return alloc

    la = traits["loss_aversion"] / 100.0
    oc = traits["overconfidence"] / 100.0

    # Overconfidence reduces sensitivity to drawdown
    effective_la = la * (1.0 - 0.8 * oc)

    # Scale shift with how bad the drawdown is (5%→0, 30%→full)
    drawdown_scale = min((portfolio_drawdown_pct - 0.05) / 0.25, 1.0)
    shift_fraction = effective_la * drawdown_scale * 0.30  # max 30% of portfolio shifts

    new_alloc = dict(alloc)

    # Find safe haven to shift INTO
    safe_haven = None
    for safe in ("bonds", "gold"):
        if safe in new_alloc:
            safe_haven = safe
            break
    if safe_haven is None:
        return alloc

    total_shift = 0.0
    for asset in list(new_alloc.keys()):
        if asset in _RISK_ASSETS and asset in new_alloc:
            shift = new_alloc[asset] * shift_fraction
            new_alloc[asset] = max(0.0, new_alloc[asset] - shift)
            total_shift += shift

    new_alloc[safe_haven] = new_alloc.get(safe_haven, 0.0) + total_shift

    return _normalize(new_alloc)


def compute_rebalance_threshold(traits: dict[str, float]) -> float:
    """
    Return drift threshold that triggers rebalancing.
    patience 0→100 returns threshold 0.05→0.20
    """
    patience = traits["patience"] / 100.0
    return 0.05 + 0.15 * patience


def compute_rebalance_interval(traits: dict[str, float]) -> int:
    """
    Return minimum months between rebalances.
    patience 0→100 returns 1→4 months
    """
    patience = traits["patience"] / 100.0
    return max(1, round(1 + 3 * patience))


def describe_trade(
    asset: str,
    old_w: float,
    new_w: float,
    trigger: str,
    trigger_value: float,
    market_context: dict[str, Any],
) -> str:
    """
    Return human-readable description of a trade.
    """
    direction = "increase" if new_w > old_w else "decrease"
    action_word = "BUY" if new_w > old_w else "SELL"

    if trigger == "fomo_sensitivity":
        momentum = market_context.get("momentum_3m", {}).get(asset, 0.0)
        pct = momentum * 100
        sign = "+" if pct >= 0 else ""
        return f"{asset} momentum {sign}{pct:.1f}% — FOMO drives allocation {direction}"

    elif trigger == "loss_aversion" and market_context.get("momentum_3m", {}).get(asset, 0) < -0.08:
        momentum = market_context.get("momentum_3m", {}).get(asset, 0.0)
        pct = momentum * 100
        return f"{asset} correction {pct:.1f}% — Loss aversion triggers {action_word}"

    elif trigger == "drawdown_protection":
        drawdown = market_context.get("drawdown", 0.0)
        pct = drawdown * 100
        return f"Drawdown {pct:.1f}% — Defensive rebalance to safe haven"

    elif trigger == "scheduled":
        return f"Scheduled rebalance — Patience threshold reached"

    elif trigger == "risk_appetite":
        return f"{asset} — Risk appetite ({trigger_value:.0f}/100) drives {direction}"

    else:
        return f"{asset} — {trigger.replace('_', ' ').title()} ({trigger_value:.0f}/100) triggers {action_word}"


def classify_persona(traits: dict[str, float]) -> str:
    """
    Classify the persona into a human-readable label based on dominant traits.
    """
    ra = traits["risk_appetite"]
    fomo = traits["fomo_sensitivity"]
    la = traits["loss_aversion"]
    patience = traits["patience"]
    db = traits["diversification_bias"]
    oc = traits["overconfidence"]

    if ra > 70 and fomo > 65:
        return "Aggressive Momentum Trader"
    if la > 70 and patience > 60:
        return "Conservative Strategist"
    if db > 70:
        return "Balanced Diversifier"
    if fomo > 70 and patience < 40:
        return "FOMO Chaser"
    if oc > 70:
        return "Overconfident Bull"
    return "Moderate Investor"


# ---------------------------------------------------------------------------
# Metrics computation
# ---------------------------------------------------------------------------

def _compute_metrics(
    portfolio_values: list[float],
    initial_capital: float,
    years: float,
) -> SimulationMetrics:
    """Compute standard financial metrics from a monthly value series."""
    if len(portfolio_values) < 2:
        return SimulationMetrics(
            total_return=0.0,
            annualized_return=0.0,
            max_drawdown=0.0,
            sharpe_ratio=0.0,
            volatility=0.0,
            best_month=0.0,
            worst_month=0.0,
            total_trades=0,
        )

    arr = np.array(portfolio_values, dtype=float)
    final_value = arr[-1]

    # Total return
    total_return = (final_value - initial_capital) / initial_capital

    # Annualized return
    if years > 0:
        annualized_return = float((1.0 + total_return) ** (1.0 / years) - 1.0)
    else:
        annualized_return = 0.0

    # Monthly returns
    monthly_returns = np.diff(arr) / arr[:-1]

    # Volatility (annualized)
    if len(monthly_returns) > 1:
        volatility = float(np.std(monthly_returns, ddof=1) * math.sqrt(12))
    else:
        volatility = 0.0

    # Sharpe ratio (risk-free = 4% annual)
    rf_monthly = 0.04 / 12
    excess_monthly = monthly_returns - rf_monthly
    if volatility > 1e-8:
        sharpe_ratio = float((annualized_return - 0.04) / volatility)
    else:
        sharpe_ratio = 0.0

    # Best / worst month
    best_month = float(np.max(monthly_returns)) if len(monthly_returns) > 0 else 0.0
    worst_month = float(np.min(monthly_returns)) if len(monthly_returns) > 0 else 0.0

    # Max drawdown
    peak = arr[0]
    max_dd = 0.0
    for v in arr:
        if v > peak:
            peak = v
        dd = (v - peak) / peak
        if dd < max_dd:
            max_dd = dd

    return SimulationMetrics(
        total_return=float(total_return),
        annualized_return=float(annualized_return),
        max_drawdown=float(max_dd),
        sharpe_ratio=float(sharpe_ratio),
        volatility=float(volatility),
        best_month=float(best_month),
        worst_month=float(worst_month),
        total_trades=0,  # filled in by caller
    )


# ---------------------------------------------------------------------------
# Database loading helpers
# ---------------------------------------------------------------------------

async def _load_prices(
    db: AsyncSession,
    asset_classes: list[str],
    start_date: date,
    end_date: date,
) -> tuple[dict[str, MarketAsset], dict[str, list[tuple[date, float]]]]:
    """
    Load active assets + their prices from DB.
    Returns:
        assets: ticker -> MarketAsset
        prices: ticker -> sorted list of (date, close)
    """
    # Load assets
    result = await db.execute(
        select(MarketAsset).where(
            MarketAsset.is_active == True,
            MarketAsset.asset_class.in_(asset_classes),
        )
    )
    asset_rows = result.scalars().all()
    assets: dict[str, MarketAsset] = {a.ticker: a for a in asset_rows}

    if not assets:
        return assets, {}

    asset_ids = [a.id for a in asset_rows]

    # Load prices within date range
    result = await db.execute(
        select(MarketPrice).where(
            MarketPrice.asset_id.in_(asset_ids),
            MarketPrice.date >= start_date,
            MarketPrice.date <= end_date,
        ).order_by(MarketPrice.date)
    )
    price_rows = result.scalars().all()

    # Build ticker -> [(date, close), ...]
    asset_id_to_ticker = {a.id: a.ticker for a in asset_rows}
    prices: dict[str, list[tuple[date, float]]] = {t: [] for t in assets}
    for row in price_rows:
        ticker = asset_id_to_ticker.get(row.asset_id)
        if ticker:
            prices[ticker].append((row.date, row.close))

    return assets, prices


def _build_monthly_series(
    daily_prices: dict[str, list[tuple[date, float]]],
) -> dict[str, dict[date, float]]:
    """
    Build month-end price series from daily data.
    Returns: ticker -> {month_end_date: close_price}
    """
    monthly: dict[str, dict[date, float]] = {}
    for ticker, series in daily_prices.items():
        monthly[ticker] = {}
        # Group by year-month, take last entry
        month_buckets: dict[tuple[int, int], tuple[date, float]] = {}
        for d, close in series:
            key = (d.year, d.month)
            # Always overwrite — since series is sorted, last wins
            month_buckets[key] = (d, close)
        for (y, m), (d, close) in sorted(month_buckets.items()):
            monthly[ticker][d] = close

    return monthly


def _get_sorted_months(
    monthly_series: dict[str, dict[date, float]],
    asset_classes_requested: list[str],
    assets: dict[str, MarketAsset],
) -> list[date]:
    """Get sorted list of month-end dates common to all tickers."""
    if not monthly_series:
        return []

    # Collect all dates across all tickers
    all_dates: set[date] = set()
    for ticker, series in monthly_series.items():
        all_dates.update(series.keys())

    return sorted(all_dates)


# ---------------------------------------------------------------------------
# Main simulation
# ---------------------------------------------------------------------------

async def run_simulation(
    db: AsyncSession,
    request: SimulationRequest,
    user_portfolio: UserPortfolio | None = None,
) -> SimulationResponse:
    """
    Run persona-driven market simulation and return full history + metrics.
    """
    # --- 1. Load price data ---
    assets, daily_prices = await _load_prices(
        db, request.asset_classes, request.start_date, request.end_date
    )

    if not assets or not any(daily_prices.values()):
        raise HTTPException(
            status_code=503,
            detail="Market data not loaded — run ingest script",
        )

    # --- 2. Resolve persona vector and traits ---
    persona_vector = request.persona_vector
    if persona_vector is None and user_portfolio is not None:
        persona_vector = user_portfolio.persona_vector

    if persona_vector and len(persona_vector) == 16:
        traits = compute_traits(np.array(persona_vector, dtype=np.float32))
    else:
        # Neutral persona: all traits at 50
        traits = {
            "risk_appetite": 50.0,
            "fomo_sensitivity": 50.0,
            "loss_aversion": 50.0,
            "patience": 50.0,
            "diversification_bias": 50.0,
            "overconfidence": 50.0,
        }

    persona_type = classify_persona(traits)

    # --- 3. Build monthly series ---
    monthly_series = _build_monthly_series(daily_prices)

    # Get the tickers that actually have data
    active_tickers = [t for t, series in monthly_series.items() if series]
    if not active_tickers:
        raise HTTPException(
            status_code=503,
            detail="Market data not loaded — run ingest script",
        )

    # Get the asset_class for each ticker
    ticker_to_class = {t: assets[t].asset_class for t in active_tickers}
    available_classes = list({ticker_to_class[t] for t in active_tickers})

    # Sorted month dates across all active tickers
    all_months = _get_sorted_months(monthly_series, request.asset_classes, assets)
    if len(all_months) < 2:
        raise HTTPException(
            status_code=503,
            detail="Market data not loaded — run ingest script",
        )

    # --- 4. Build per-ticker price array aligned to all_months ---
    # For missing dates in a ticker, forward-fill from previous available
    price_matrix: dict[str, list[float]] = {}
    for ticker in active_tickers:
        series = monthly_series[ticker]
        sorted_dates = sorted(series.keys())
        prices_arr: list[float] = []
        last_price = None
        for m in all_months:
            # Find the closest available price on or before m
            # series is a dict; we already have the last-trading-day of each month
            if m in series:
                last_price = series[m]
            elif last_price is None:
                # Try to find the first available price
                for d in sorted_dates:
                    if d <= m:
                        last_price = series[d]
                    else:
                        break
            prices_arr.append(last_price if last_price is not None else 0.0)
        price_matrix[ticker] = prices_arr

    # Remove tickers with all-zero prices
    price_matrix = {t: p for t, p in price_matrix.items() if any(v > 0 for v in p)}
    active_tickers = list(price_matrix.keys())

    if not active_tickers:
        raise HTTPException(
            status_code=503,
            detail="Market data not loaded — run ingest script",
        )

    n_months = len(all_months)
    initial_capital = request.initial_capital

    # --- 5. Initial allocation ---
    available_classes_for_alloc = [ticker_to_class[t] for t in active_tickers]
    # Use asset-class level allocation, then map to tickers
    # If multiple tickers per class, split equally
    class_count: dict[str, int] = {}
    for t in active_tickers:
        ac = ticker_to_class[t]
        class_count[ac] = class_count.get(ac, 0) + 1

    def class_alloc_to_ticker_alloc(class_alloc: dict[str, float]) -> dict[str, float]:
        """Distribute class-level weights evenly among tickers of that class."""
        ticker_alloc: dict[str, float] = {}
        for t in active_tickers:
            ac = ticker_to_class[t]
            weight = class_alloc.get(ac, 0.0) / class_count.get(ac, 1)
            ticker_alloc[t] = weight
        return ticker_alloc

    def ticker_alloc_to_class_alloc(ticker_alloc: dict[str, float]) -> dict[str, float]:
        """Aggregate ticker-level weights to asset-class level."""
        class_alloc: dict[str, float] = {}
        for t, w in ticker_alloc.items():
            ac = ticker_to_class[t]
            class_alloc[ac] = class_alloc.get(ac, 0.0) + w
        return class_alloc

    # Compute initial class allocation
    initial_class_alloc = compute_base_allocation(traits, available_classes_for_alloc)
    initial_ticker_alloc = class_alloc_to_ticker_alloc(initial_class_alloc)

    # Initialize holdings (number of units per ticker)
    holdings: dict[str, float] = {}
    for t in active_tickers:
        p0 = price_matrix[t][0]
        if p0 > 0:
            holdings[t] = initial_ticker_alloc.get(t, 0.0) * initial_capital / p0
        else:
            holdings[t] = 0.0

    # --- 6. Monthly simulation loop ---
    portfolio_history: list[PortfolioPoint] = []
    trades: list[TradeRecord] = []
    portfolio_values: list[float] = []

    peak_value = initial_capital
    months_since_rebalance = 0
    rebalance_interval = compute_rebalance_interval(traits)
    rebalance_threshold = compute_rebalance_threshold(traits)

    for t_idx, month_date in enumerate(all_months):
        prices_t = {ticker: price_matrix[ticker][t_idx] for ticker in active_tickers}

        # --- Update portfolio value ---
        portfolio_value = sum(
            holdings[ticker] * prices_t[ticker]
            for ticker in active_tickers
            if prices_t[ticker] > 0
        )
        if portfolio_value <= 0:
            portfolio_value = initial_capital  # safety fallback

        # --- Track drawdown ---
        peak_value = max(peak_value, portfolio_value)
        drawdown = (portfolio_value - peak_value) / peak_value  # <= 0

        # --- Current allocation (ticker level) ---
        current_ticker_alloc: dict[str, float] = {}
        for ticker in active_tickers:
            current_ticker_alloc[ticker] = (
                holdings[ticker] * prices_t[ticker] / portfolio_value
                if portfolio_value > 0 else 0.0
            )

        current_class_alloc = ticker_alloc_to_class_alloc(current_ticker_alloc)

        # --- Compute 3-month momentum (class level) ---
        momentum_class: dict[str, float] = {}
        lookback = max(0, t_idx - 3)
        for ticker in active_tickers:
            ac = ticker_to_class[ticker]
            p_now = price_matrix[ticker][t_idx]
            p_past = price_matrix[ticker][lookback]
            if p_past > 0 and p_now > 0:
                ret = (p_now / p_past) - 1.0
            else:
                ret = 0.0
            # Average for multi-ticker classes
            if ac not in momentum_class:
                momentum_class[ac] = ret
            else:
                momentum_class[ac] = (momentum_class[ac] + ret) / 2.0

        # --- Compute target class allocation ---
        target_class = compute_base_allocation(traits, available_classes_for_alloc)
        target_class = apply_momentum_overlay(target_class, momentum_class, traits)
        target_class = apply_drawdown_protection(target_class, abs(drawdown), traits)

        # --- Map to ticker allocation ---
        target_ticker_alloc = class_alloc_to_ticker_alloc(target_class)

        # --- Should we rebalance? ---
        months_since_rebalance += 1
        max_drift = max(
            abs(current_ticker_alloc.get(t, 0.0) - target_ticker_alloc.get(t, 0.0))
            for t in active_tickers
        )

        market_context = {
            "momentum_3m": {ticker_to_class[t]: momentum_class.get(ticker_to_class[t], 0) for t in active_tickers},
            "drawdown": drawdown,
        }

        if (
            months_since_rebalance >= rebalance_interval
            and max_drift >= rebalance_threshold
        ):
            # --- Determine trigger ---
            dominant_trigger = "scheduled"
            dominant_trait_value = traits["patience"]

            # Check what caused the biggest allocation change
            for ticker in active_tickers:
                ac = ticker_to_class[ticker]
                mom = momentum_class.get(ac, 0.0)
                drift = target_ticker_alloc.get(ticker, 0.0) - current_ticker_alloc.get(ticker, 0.0)

                if abs(drawdown) > 0.05 and abs(drift) > 0.05:
                    dominant_trigger = "drawdown_protection"
                    dominant_trait_value = traits["loss_aversion"]
                    break
                elif mom > 0.08 and drift > 0.03:
                    dominant_trigger = "fomo_sensitivity"
                    dominant_trait_value = traits["fomo_sensitivity"]
                    break
                elif mom < -0.08 and drift < -0.03:
                    dominant_trigger = "loss_aversion"
                    dominant_trait_value = traits["loss_aversion"]
                    break

            # --- Record trades ---
            for ticker in active_tickers:
                old_w = current_ticker_alloc.get(ticker, 0.0)
                new_w = target_ticker_alloc.get(ticker, 0.0)
                delta = abs(new_w - old_w)

                if delta < 0.005:
                    continue  # No meaningful trade

                action = "BUY" if new_w > old_w else "SELL"
                reason = describe_trade(
                    asset=ticker,
                    old_w=old_w,
                    new_w=new_w,
                    trigger=dominant_trigger,
                    trigger_value=dominant_trait_value,
                    market_context={
                        "momentum_3m": {t: momentum_class.get(ticker_to_class[t], 0) for t in active_tickers},
                        "drawdown": drawdown,
                    },
                )
                trades.append(TradeRecord(
                    date=month_date.isoformat(),
                    asset=ticker,
                    action=action,
                    old_weight=float(old_w),
                    new_weight=float(new_w),
                    reason=reason,
                    trigger_trait=dominant_trigger,
                    trait_value=float(dominant_trait_value),
                ))

            # --- Execute rebalance ---
            for ticker in active_tickers:
                p = prices_t[ticker]
                if p > 0:
                    holdings[ticker] = target_ticker_alloc.get(ticker, 0.0) * portfolio_value / p

            # --- Apply transaction cost (0.1% per unit of turnover) ---
            total_turnover = sum(
                abs(target_ticker_alloc.get(t, 0.0) - current_ticker_alloc.get(t, 0.0))
                for t in active_tickers
            ) / 2.0
            portfolio_value *= (1.0 - total_turnover * 0.001)

            # Adjust holdings for cost
            for ticker in active_tickers:
                p = prices_t[ticker]
                if p > 0:
                    holdings[ticker] = target_ticker_alloc.get(ticker, 0.0) * portfolio_value / p

            months_since_rebalance = 0

        # --- Record portfolio point ---
        portfolio_values.append(portfolio_value)
        portfolio_history.append(PortfolioPoint(
            date=month_date.isoformat(),
            value=round(portfolio_value, 2),
            allocation=ticker_alloc_to_class_alloc(current_ticker_alloc),
        ))

    # --- 7. Benchmark: SPY buy-and-hold ---
    benchmark_history: list[PortfolioPoint] = []
    spy_ticker = None
    for t in active_tickers:
        if t == "SPY":
            spy_ticker = t
            break
    # Fallback: use the first stocks-class ticker
    if spy_ticker is None:
        for t in active_tickers:
            if ticker_to_class[t] == "stocks":
                spy_ticker = t
                break

    if spy_ticker and price_matrix[spy_ticker][0] > 0:
        spy_shares = initial_capital / price_matrix[spy_ticker][0]
        for t_idx, month_date in enumerate(all_months):
            spy_price = price_matrix[spy_ticker][t_idx]
            bval = spy_shares * spy_price if spy_price > 0 else initial_capital
            benchmark_history.append(PortfolioPoint(
                date=month_date.isoformat(),
                value=round(bval, 2),
                allocation={"stocks": 1.0},
            ))
    else:
        # No SPY data — benchmark equals portfolio
        benchmark_history = list(portfolio_history)

    # --- 8. Compute metrics ---
    years = max(
        (all_months[-1] - all_months[0]).days / 365.25,
        1.0 / 12,
    ) if len(all_months) >= 2 else 1.0

    metrics = _compute_metrics(portfolio_values, initial_capital, years)
    metrics.total_trades = len(trades)

    # --- 9. Load market events in date range ---
    events_result = await db.execute(
        select(MarketEvent).where(
            MarketEvent.date >= request.start_date,
            MarketEvent.date <= request.end_date,
        ).order_by(MarketEvent.date)
    )
    event_rows = events_result.scalars().all()
    events: list[EventAnnotation] = [
        EventAnnotation(
            date=ev.date.isoformat(),
            label=ev.label,
            impact=ev.impact,
        )
        for ev in event_rows
    ]

    # --- 10. Final allocation ---
    if portfolio_values:
        final_pv = portfolio_values[-1]
        last_prices = {ticker: price_matrix[ticker][-1] for ticker in active_tickers}
        final_ticker_alloc = {
            ticker: holdings[ticker] * last_prices[ticker] / final_pv
            for ticker in active_tickers
            if final_pv > 0
        }
        final_allocation = ticker_alloc_to_class_alloc(final_ticker_alloc)
    else:
        final_allocation = dict(initial_class_alloc)

    return SimulationResponse(
        portfolio_history=portfolio_history,
        benchmark_history=benchmark_history,
        trades=trades,
        events=events,
        metrics=metrics,
        final_allocation=final_allocation,
        traits=traits,
        persona_type=persona_type,
    )
