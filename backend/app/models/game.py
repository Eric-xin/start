import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import enum


class SwipeAction(str, enum.Enum):
    left = "left"
    right = "right"
    hold = "hold"


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    persona_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("personas.id", ondelete="SET NULL"), nullable=True, index=True
    )
    stage: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    progress: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    persona_vector: Mapped[list | None] = mapped_column(JSON, nullable=True)
    topic_mastery: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    last_card_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    investor_rank: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    capital: Mapped[float] = mapped_column(Float, default=10000.0, nullable=False)
    portfolio_weights: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    peak_capital: Mapped[float] = mapped_column(Float, default=10000.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    events: Mapped[list["GameEvent"]] = relationship("GameEvent", back_populates="session")


class GameEvent(Base):
    __tablename__ = "game_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    card_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cards.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[SwipeAction] = mapped_column(SAEnum(SwipeAction), nullable=False)
    reward: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    persona_before: Mapped[list] = mapped_column(JSON, nullable=False)
    persona_after: Mapped[list] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    session: Mapped["GameSession"] = relationship("GameSession", back_populates="events")


class GameConfig(Base):
    __tablename__ = "game_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[dict | list | float | str] = mapped_column(JSON, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
