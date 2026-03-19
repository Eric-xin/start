from __future__ import annotations

from datetime import date
from typing import Optional, Any

from pydantic import BaseModel

from app.schemas.card import CardOut
from app.schemas.achievement import AchievementOut


class PortfolioOut(BaseModel):
    id: str
    capital: float
    net_worth: float
    peak_net_worth: float
    total_income_received: float
    stage: int
    investor_rank: int
    total_cards_played: int
    topic_mastery: dict
    portfolio_weights: dict
    last_income_date: Optional[date]
    income_streak: int
    persona_id: Optional[str]
    can_claim_income: bool
    pending_income: float
    created_at: str
    updated_at: str


class ClaimIncomeResponse(BaseModel):
    amount: float
    new_capital: float
    new_net_worth: float
    streak: int
    message: str
    newly_unlocked_achievements: list[AchievementOut] = []


class PlayCardRequest(BaseModel):
    card_id: str
    action: str  # "left" or "right"


class PlayCardResponse(BaseModel):
    lesson: str
    reward: float
    capital_before: float
    capital_after: float
    net_worth: float
    next_card: Optional[CardOut]
    portfolio: PortfolioOut
    newly_unlocked_achievements: list[AchievementOut] = []


class NetWorthSnapshotOut(BaseModel):
    id: str
    net_worth: float
    capital: float
    snapshot_date: date
    created_at: str


class CardPlayOut(BaseModel):
    id: str
    action: str
    reward: float
    capital_before: float
    capital_after: float
    created_at: str
    card: Optional[CardOut]
