"""Pydantic v2 schemas for market simulation."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class SimulationRequest(BaseModel):
    persona_vector: list[float] | None = None  # 16-dim; None = use user's portfolio persona
    start_date: date = date(2021, 1, 1)
    end_date: date = date(2026, 1, 1)
    initial_capital: float = 10000.0
    asset_classes: list[str] = ["stocks", "bonds", "gold", "bitcoin", "tech"]


class PortfolioPoint(BaseModel):
    date: str  # ISO date "YYYY-MM-DD"
    value: float
    allocation: dict[str, float]  # asset_class -> weight


class TradeRecord(BaseModel):
    date: str
    asset: str
    action: str  # "BUY" | "SELL" | "HOLD"
    old_weight: float
    new_weight: float
    reason: str  # human-readable
    trigger_trait: str  # which trait drove this
    trait_value: float


class EventAnnotation(BaseModel):
    date: str
    label: str
    impact: str  # "positive" | "negative" | "neutral"


class SimulationMetrics(BaseModel):
    total_return: float        # e.g. 0.45 = 45%
    annualized_return: float
    max_drawdown: float        # negative e.g. -0.25
    sharpe_ratio: float
    volatility: float          # annualized
    best_month: float
    worst_month: float
    total_trades: int


class SimulationResponse(BaseModel):
    portfolio_history: list[PortfolioPoint]
    benchmark_history: list[PortfolioPoint]  # SPY buy-and-hold
    trades: list[TradeRecord]
    events: list[EventAnnotation]
    metrics: SimulationMetrics
    final_allocation: dict[str, float]
    traits: dict[str, float]
    persona_type: str  # human label: "Conservative", "Aggressive", "FOMO Trader", etc.


class AssetInfo(BaseModel):
    id: str
    ticker: str
    name: str
    asset_class: str
    description: str
    data_available: bool
