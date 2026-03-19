import uuid
from datetime import date, datetime
from pydantic import BaseModel
from app.models.game import SwipeAction
from app.schemas.card import CardOut


class GameSessionOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    persona_id: uuid.UUID | None = None
    stage: int
    progress: float
    topic_mastery: dict
    investor_rank: int
    capital: float
    portfolio_weights: dict
    peak_capital: float
    is_daily: bool
    daily_date: date | None = None
    daily_cards_played: int
    daily_target: int
    daily_completed: bool
    streak_bonus_awarded: float
    created_at: datetime
    updated_at: datetime


class GameEventOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    card_id: int | None
    action: str
    reward: float
    card: CardOut | None = None
    created_at: datetime


class SwipeRequest(BaseModel):
    card_id: int
    action: SwipeAction


class SwipeResponse(BaseModel):
    lesson: str
    reward: float
    session: GameSessionOut
    next_card: CardOut | None = None


class DailyStatusOut(BaseModel):
    streak_count: int
    cards_completed_today: int
    daily_target: int
    remaining_cards: int
    completed_today: bool
    streak_bonus_capital: float = 1000.0
