"""
Synthetic market data generator.

Generates realistic-looking price series and news for the 5 game assets
based solely on the portfolio's market_state parameters:
  sentiment   [-1, 1]  — overall market mood
  fundamentals[-1, 1]  — economic health / earnings quality
  inflation   [-1, 1]  — price pressure (positive = high inflation)
  greed       [-1, 1]  — risk appetite / speculative heat
  volatility  [ 0, 1]  — turbulence level
"""
from __future__ import annotations

import math
import hashlib
import random
from typing import Any

# ─── Asset configuration ──────────────────────────────────────────────────────
# Each asset: base_price, friendly name, class,
#   and sensitivity weights to each market_state dimension.
# Weights are how much that dimension drives the asset's drift (sign matters).
ASSETS: list[dict[str, Any]] = [
    {
        "ticker": "SPY",
        "name": "S&P 500 ETF",
        "asset_class": "stocks",
        "base": 480.0,
        "w_sentiment": 0.65,
        "w_fundamentals": 0.75,
        "w_inflation": -0.25,
        "w_greed": 0.30,
        "base_vol": 0.13,   # annualised σ
    },
    {
        "ticker": "QQQ",
        "name": "Nasdaq 100 ETF",
        "asset_class": "tech",
        "base": 420.0,
        "w_sentiment": 0.70,
        "w_fundamentals": 0.55,
        "w_inflation": -0.35,
        "w_greed": 0.55,
        "base_vol": 0.20,
    },
    {
        "ticker": "AGG",
        "name": "US Bond Index ETF",
        "asset_class": "bonds",
        "base": 97.0,
        "w_sentiment": -0.40,
        "w_fundamentals": 0.20,
        "w_inflation": -0.65,
        "w_greed": -0.30,
        "base_vol": 0.06,
    },
    {
        "ticker": "GLD",
        "name": "Gold ETF",
        "asset_class": "gold",
        "base": 220.0,
        "w_sentiment": -0.30,
        "w_fundamentals": -0.35,
        "w_inflation": 0.70,
        "w_greed": 0.20,
        "base_vol": 0.11,
    },
    {
        "ticker": "BTC",
        "name": "Bitcoin",
        "asset_class": "bitcoin",
        "base": 85_000.0,
        "w_sentiment": 0.40,
        "w_fundamentals": 0.10,
        "w_inflation": 0.20,
        "w_greed": 0.90,
        "base_vol": 0.55,
    },
]

ASSET_BY_TICKER: dict[str, dict] = {a["ticker"]: a for a in ASSETS}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _seed(portfolio_id: str, market_state: dict, extra: str = "") -> int:
    """Stable deterministic seed from portfolio + market snapshot."""
    key = f"{portfolio_id}:{extra}:" + ":".join(
        f"{k}={round(v, 3)}" for k, v in sorted(market_state.items())
    )
    return int(hashlib.md5(key.encode()).hexdigest(), 16) % (2 ** 31)


def _annualised_drift(cfg: dict, ms: dict) -> float:
    """Compute the asset's annualised expected drift from market_state weights."""
    s = ms.get("sentiment", 0.0)
    f = ms.get("fundamentals", 0.0)
    i = ms.get("inflation", 0.0)
    g = ms.get("greed", 0.0)
    return (
        cfg["w_sentiment"] * s
        + cfg["w_fundamentals"] * f
        + cfg["w_inflation"] * i
        + cfg["w_greed"] * g
    ) * 0.30   # scale factor → realistic annual return range


def _effective_vol(cfg: dict, ms: dict) -> float:
    """Annualised volatility, amplified by the market's volatility parameter."""
    v = ms.get("volatility", 0.1)
    return cfg["base_vol"] * (1 + v * 0.8)


def generate_price_series(
    ticker: str,
    portfolio_id: str,
    market_state: dict,
    n_days: int = 90,
) -> list[float]:
    """
    Generate n_days of synthetic daily close prices for one asset.
    Uses geometric Brownian motion with drift/vol derived from market_state.
    Seed is stable so the same portfolio + market_state always produces the
    same series — prices only shift when the market_state changes.
    """
    cfg = ASSET_BY_TICKER[ticker]
    rng = random.Random(_seed(portfolio_id, market_state, ticker))

    annual_drift = _annualised_drift(cfg, market_state)
    annual_vol = _effective_vol(cfg, market_state)
    daily_drift = annual_drift / 252
    daily_vol = annual_vol / math.sqrt(252)

    price = cfg["base"]
    prices: list[float] = [round(price, 2)]

    for _ in range(n_days - 1):
        shock = rng.gauss(daily_drift, daily_vol)
        price = max(price * (1 + shock), cfg["base"] * 0.10)
        prices.append(round(price, 2))

    return prices


def compute_returns(prices: list[float]) -> dict[str, float]:
    """7d, 30d, 90d returns from a price series (last value = latest)."""
    def ret(a: float, b: float) -> float:
        return round((b / a - 1) * 100, 2) if a else 0.0

    latest = prices[-1]
    return {
        "return_7d":  ret(prices[-8]  if len(prices) >= 8  else prices[0], latest),
        "return_30d": ret(prices[-31] if len(prices) >= 31 else prices[0], latest),
        "return_90d": ret(prices[0],  latest),
    }


def build_market_overview(portfolio_id: str, market_state: dict) -> list[dict]:
    """
    Full market overview for all assets — used by GET /api/hud/market.
    Returns sparkline (last 30 days) and return metrics.
    """
    result = []
    for cfg in ASSETS:
        prices = generate_price_series(cfg["ticker"], portfolio_id, market_state, n_days=90)
        rets = compute_returns(prices)
        trend = "up" if rets["return_7d"] > 0.5 else "down" if rets["return_7d"] < -0.5 else "flat"
        result.append({
            "ticker": cfg["ticker"],
            "name": cfg["name"],
            "asset_class": cfg["asset_class"],
            "latest_price": prices[-1],
            **rets,
            "trend": trend,
            "sparkline": prices[-30:],   # last 30 days for compact chart
        })
    return result


def build_asset_detail(ticker: str, portfolio_id: str, market_state: dict) -> dict:
    """
    Full 90-day detail for one asset — used by GET /api/hud/market/{ticker}.
    Includes interpretation text and per-factor contribution breakdown.
    """
    cfg = ASSET_BY_TICKER.get(ticker)
    if not cfg:
        return {}

    prices = generate_price_series(ticker, portfolio_id, market_state, n_days=90)
    rets = compute_returns(prices)

    s = market_state.get("sentiment", 0.0)
    f = market_state.get("fundamentals", 0.0)
    i = market_state.get("inflation", 0.0)
    g = market_state.get("greed", 0.0)
    v = market_state.get("volatility", 0.1)

    # Factor contributions (normalised for display as %)
    raw = {
        "Sentiment":    cfg["w_sentiment"] * s,
        "Fundamentals": cfg["w_fundamentals"] * f,
        "Inflation":    cfg["w_inflation"] * i,
        "Greed":        cfg["w_greed"] * g,
    }
    total = sum(abs(x) for x in raw.values()) or 1
    factors = {k: round(v_ / total * 100, 1) for k, v_ in raw.items()}

    interpretation = _interpret(ticker, cfg, market_state)

    return {
        "ticker": cfg["ticker"],
        "name": cfg["name"],
        "asset_class": cfg["asset_class"],
        "latest_price": prices[-1],
        **rets,
        "prices_90d": prices,
        "factors": factors,          # dict: factor → % contribution (signed)
        "interpretation": interpretation,
        "volatility_regime": "HIGH" if v > 0.5 else "ELEVATED" if v > 0.25 else "LOW",
        "annual_drift_pct": round(_annualised_drift(cfg, market_state) * 100, 1),
        "annual_vol_pct": round(_effective_vol(cfg, market_state) * 100, 1),
    }


# ─── Interpretation text ──────────────────────────────────────────────────────

def _interpret(ticker: str, cfg: dict, ms: dict) -> str:
    s = ms.get("sentiment", 0.0)
    f = ms.get("fundamentals", 0.0)
    i_val = ms.get("inflation", 0.0)
    g = ms.get("greed", 0.0)
    v = ms.get("volatility", 0.1)
    drift = _annualised_drift(cfg, ms)
    vol = _effective_vol(cfg, ms)

    direction = "up" if drift > 0.05 else "down" if drift < -0.05 else "sideways"
    strength = "sharply" if abs(drift) > 0.20 else "moderately" if abs(drift) > 0.08 else "gently"

    if ticker == "SPY":
        driver = "bullish sentiment and solid earnings" if s > 0.2 and f > 0.1 else \
                 "deteriorating fundamentals" if f < -0.2 else \
                 "mixed signals between sentiment and macro"
        return (
            f"Broad equities trending {direction} {strength}, driven by {driver}. "
            f"Inflation at {'elevated' if i_val > 0.3 else 'moderate' if i_val > 0 else 'low'} levels "
            f"{'pressures' if i_val > 0.2 else 'supports'} real returns. "
            f"Annualised vol {vol*100:.0f}% — {'remain cautious' if v > 0.4 else 'conditions are manageable'}."
        )
    if ticker == "QQQ":
        driver = "AI-driven growth optimism" if g > 0.3 and s > 0.2 else \
                 "rate sensitivity and margin compression" if i_val > 0.3 else \
                 "slowing earnings momentum"
        return (
            f"Tech/growth names moving {direction} {strength} amid {driver}. "
            f"Greed index at {g*100:.0f}/100 — {'speculative excess present' if g > 0.5 else 'risk appetite normalised'}. "
            f"Rate environment {'headwind' if i_val > 0.2 else 'tailwind'} for long-duration tech."
        )
    if ticker == "AGG":
        driver = "rate cut expectations" if i_val < -0.1 else \
                 "inflationary pressure eroding fixed income returns" if i_val > 0.2 else \
                 "flight to quality amid uncertainty" if s < -0.2 else \
                 "stable rate outlook"
        return (
            f"Bond prices moving {direction} {strength}, reflecting {driver}. "
            f"Inflation at {i_val*100:.0f}/100 — {'negative real yields likely' if i_val > 0.3 else 'real yield positive'}. "
            f"Duration risk is {'elevated' if v > 0.3 else 'contained'} given current volatility regime."
        )
    if ticker == "GLD":
        driver = "safe-haven demand as sentiment deteriorates" if s < -0.2 else \
                 "inflation hedge thesis intact" if i_val > 0.3 else \
                 "central bank accumulation" if f < 0 else \
                 "profit-taking amid risk-on mood"
        return (
            f"Gold trending {direction} {strength}, underpinned by {driver}. "
            f"Inflation parameter at {i_val*100:.0f}/100 — "
            f"{'inflation hedge in demand' if i_val > 0.2 else 'inflation threat muted, reducing gold appeal'}. "
            f"Sentiment at {s*100:.0f}/100 {'supports' if s < 0 else 'competes with'} safe-haven flows."
        )
    if ticker == "BTC":
        driver = "peak speculative appetite" if g > 0.5 else \
                 "institutional accumulation phase" if g > 0.2 and s > 0 else \
                 "risk-off deleveraging" if s < -0.2 else \
                 "consolidation near cycle levels"
        return (
            f"Bitcoin moving {direction} {strength} — {driver}. "
            f"Greed index {g*100:.0f}/100 is the primary driver; "
            f"{'extreme greed historically precedes corrections' if g > 0.6 else 'moderate greed suggests sustainable trend'}. "
            f"Vol at {vol*100:.0f}% annualised — position sizing accordingly."
        )
    return f"{cfg['name']} trending {direction} based on current market parameters."


# ─── News from market state ───────────────────────────────────────────────────

def categories_from_market_state(ms: dict) -> list[str]:
    """
    Map market_state values to the most relevant news template categories.
    Returns categories ordered by relevance (strongest signal first).
    """
    s = ms.get("sentiment", 0.0)
    f = ms.get("fundamentals", 0.0)
    i = ms.get("inflation", 0.0)
    g = ms.get("greed", 0.0)
    v = ms.get("volatility", 0.1)

    scored: list[tuple[float, str]] = [
        (abs(i) * (1 if i > 0 else 0.5),    "inflation"         if i > 0.15 else "rate_cut"),
        (i * 0.8,                             "rate_hike"         if i > 0.25 else "rate_cut"),
        ((-s + v) * 0.9,                      "market_crash"      if s < -0.25 or v > 0.45 else "recession_fear"),
        ((s + f) * 0.8,                       "market_rally"      if s > 0.25 and f > 0.0 else "tech_move"),
        (g * 0.9,                             "crypto_volatility" if g > 0.3 else "market_rally"),
        ((i - s) * 0.7,                       "gold_move"         if i > 0.1 or s < -0.1 else "commodity"),
        ((s + g) * 0.6,                       "tech_move"         if s > 0.1 or g > 0.2 else "bond_market"),
        ((-f - s) * 0.7,                      "recession_fear"    if f < -0.2 else "bond_market"),
        (v * 0.5,                             "geopolitical"      if v > 0.3 else "commodity"),
        (abs(i) * 0.4,                        "bond_market"),
    ]

    seen: set[str] = set()
    result: list[str] = []
    for score, cat in sorted(scored, key=lambda x: -abs(x[0])):
        if cat not in seen:
            seen.add(cat)
            result.append(cat)

    # Always include at least 6 categories for variety
    all_cats = [
        "inflation", "rate_hike", "rate_cut", "market_crash", "market_rally",
        "crypto_volatility", "gold_move", "tech_move", "recession_fear",
        "commodity", "bond_market", "geopolitical",
    ]
    for cat in all_cats:
        if len(result) >= 8:
            break
        if cat not in seen:
            result.append(cat)
            seen.add(cat)

    return result
