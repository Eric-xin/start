import uuid
from datetime import datetime
from sqlalchemy import Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


STRATEGIES = ["savings", "bonds", "stocks", "index", "alternatives"]

STRATEGY_META = {
    "savings":      {"label": "Savings & Cash",   "stage": 1, "unlock_at": 0},
    "bonds":        {"label": "Fixed Income",      "stage": 2, "unlock_at": 20},
    "stocks":       {"label": "Equities",          "stage": 3, "unlock_at": 40},
    "index":        {"label": "Index Funds",       "stage": 4, "unlock_at": 70},
    "alternatives": {"label": "Alternatives",      "stage": 5, "unlock_at": 100},
}


class UserProgress(Base):
    __tablename__ = "user_progress"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    unlocked_strategies: Mapped[list] = mapped_column(JSON, nullable=False)
    enabled_strategies: Mapped[list] = mapped_column(JSON, nullable=False)
    total_cards_played: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
