import enum
from sqlalchemy import String, Float, Integer, Boolean, Enum as SAEnum, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class CardType(str, enum.Enum):
    education = "education"
    event = "event"
    action = "action"


class CardBandColor(str, enum.Enum):
    red = "red"
    green = "green"
    amber = "amber"
    purple = "purple"
    steel_blue = "steel_blue"


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    card_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    type: Mapped[CardType] = mapped_column(SAEnum(CardType), nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    body: Mapped[str] = mapped_column(String(280), nullable=False)
    emoji: Mapped[str] = mapped_column(String(8), nullable=False)
    stage_min: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    stage_max: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    topics: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    linked_traits: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    difficulty: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    diagnostic_power: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    base_priority: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    cooldown: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    left_choice: Mapped[str] = mapped_column(String(80), nullable=False)
    right_choice: Mapped[str] = mapped_column(String(80), nullable=False)
    left_lesson: Mapped[str] = mapped_column(Text, nullable=False)
    right_lesson: Mapped[str] = mapped_column(Text, nullable=False)
    card_band_color: Mapped[CardBandColor] = mapped_column(
        SAEnum(CardBandColor), default=CardBandColor.steel_blue, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Numerical value range for event and action cards — None for education cards
    value_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    value_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    value_step: Mapped[float | None] = mapped_column(Float, nullable=True)
