"""Market simulation models — assets, prices, and events."""
from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import String, Float, Boolean, Date, JSON, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MarketAsset(Base):
    __tablename__ = "market_assets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticker: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    asset_class: Mapped[str] = mapped_column(String(50), nullable=False)  # "stocks", "bonds", "gold", "bitcoin", "tech"
    description: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    prices: Mapped[list["MarketPrice"]] = relationship(
        "MarketPrice", back_populates="asset", cascade="all, delete-orphan"
    )


class MarketPrice(Base):
    __tablename__ = "market_prices"

    __table_args__ = (
        Index("ix_market_prices_asset_date", "asset_id", "date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("market_assets.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    daily_return: Mapped[float | None] = mapped_column(Float, nullable=True)  # pre-computed pct change

    asset: Mapped["MarketAsset"] = relationship("MarketAsset", back_populates="prices")


class MarketEvent(Base):
    __tablename__ = "market_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    impact: Mapped[str] = mapped_column(String(10), nullable=False, default="neutral")  # "positive" | "negative" | "neutral"
    affected_assets: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
