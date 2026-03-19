from pydantic import BaseModel
from app.models.card import CardType, CardBandColor


class CardOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    type: CardType
    title: str
    body: str
    emoji: str
    stage_min: int
    stage_max: int
    topics: list
    linked_traits: list
    difficulty: float
    diagnostic_power: float
    left_choice: str
    right_choice: str
    left_lesson: str
    right_lesson: str
    card_band_color: CardBandColor


class CardCreate(BaseModel):
    type: CardType
    title: str
    body: str
    emoji: str
    stage_min: int = 1
    stage_max: int = 5
    topics: list = []
    linked_traits: list = []
    difficulty: float = 0.5
    diagnostic_power: float = 0.5
    base_priority: float = 1.0
    cooldown: int = 5
    left_choice: str
    right_choice: str
    left_lesson: str
    right_lesson: str
    card_band_color: CardBandColor = CardBandColor.steel_blue


class CardUpdate(BaseModel):
    type: CardType | None = None
    title: str | None = None
    body: str | None = None
    emoji: str | None = None
    stage_min: int | None = None
    stage_max: int | None = None
    topics: list | None = None
    linked_traits: list | None = None
    difficulty: float | None = None
    diagnostic_power: float | None = None
    base_priority: float | None = None
    cooldown: int | None = None
    left_choice: str | None = None
    right_choice: str | None = None
    left_lesson: str | None = None
    right_lesson: str | None = None
    card_band_color: CardBandColor | None = None
    is_active: bool | None = None
