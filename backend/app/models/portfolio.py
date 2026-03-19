"""Portfolio model — replaces session-based gameplay with continuous play."""

from __future__ import annotations

import uuid
from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    String,
    Float,
    Integer,
    BigInteger,
    DateTime,
    Date,
    JSON,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserPortfolio(Base):
    __tablename__ = "user_portfolios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )

    # Capital & wealth
    capital: Mapped[float] = mapped_column(Float, default=10_000.0)
    net_worth: Mapped[float] = mapped_column(Float, default=10_000.0)
    peak_net_worth: Mapped[float] = mapped_column(Float, default=10_000.0)
    total_income_received: Mapped[float] = mapped_column(Float, default=10_000.0)

    # Learning progress
    stage: Mapped[int] = mapped_column(Integer, default=1)
    investor_rank: Mapped[int] = mapped_column(Integer, default=1)
    total_cards_played: Mapped[int] = mapped_column(Integer, default=0)
    topic_mastery: Mapped[dict] = mapped_column(JSON, default=dict)
    portfolio_weights: Mapped[dict] = mapped_column(JSON, default=dict)
    # Cumulative market state driven by card weights
    # Keys: sentiment, inflation, greed, volatility, fundamentals — each in [-1.0, 1.0]
    market_state: Mapped[dict] = mapped_column(JSON, default=dict)
    last_card_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Daily income
    last_income_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    income_streak: Mapped[int] = mapped_column(Integer, default=0)

    # Active persona (FK + cached vector for fast recommender access)
    persona_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("personas.id", ondelete="SET NULL"),
        nullable=True,
    )
    persona_vector: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    companion_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="portfolio")
    persona: Mapped[Optional["Persona"]] = relationship("Persona")
    card_plays: Mapped[list["CardPlay"]] = relationship(
        "CardPlay", back_populates="portfolio", order_by="CardPlay.created_at.desc()"
    )
    net_worth_snapshots: Mapped[list["NetWorthSnapshot"]] = relationship(
        "NetWorthSnapshot", back_populates="portfolio"
    )


class CardPlay(Base):
    __tablename__ = "card_plays"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_portfolios.id"), nullable=False
    )
    card_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cards.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(10))
    reward: Mapped[float] = mapped_column(Float, default=0.0)
    capital_before: Mapped[float] = mapped_column(Float)
    capital_after: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    portfolio: Mapped["UserPortfolio"] = relationship(
        "UserPortfolio", back_populates="card_plays"
    )
    card: Mapped[Optional["Card"]] = relationship("Card")


class NetWorthSnapshot(Base):
    __tablename__ = "net_worth_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_portfolios.id"), nullable=False
    )
    net_worth: Mapped[float] = mapped_column(Float)
    capital: Mapped[float] = mapped_column(Float)
    snapshot_date: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    portfolio: Mapped["UserPortfolio"] = relationship(
        "UserPortfolio", back_populates="net_worth_snapshots"
    )
