import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.game import SwipeAction
from app.schemas.card import CardOut


class GameSessionOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    stage: int
    progress: float
    persona_vector: list
    topic_mastery: dict
    investor_rank: int
    capital: float
    portfolio_weights: dict
    peak_capital: float
    created_at: datetime
    updated_at: datetime


class SwipeRequest(BaseModel):
    card_id: int
    action: SwipeAction


class SwipeResponse(BaseModel):
    lesson: str
    reward: float
    session: GameSessionOut
    next_card: CardOut | None = None


class TraitsOut(BaseModel):
    risk_appetite: float
    fomo_sensitivity: float
    loss_aversion: float
    patience: float
    diversification_bias: float
    overconfidence: float
