import uuid
from datetime import datetime
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
