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

# Decks are sub-collections within a strategy, mapped to card topics.
# topics=[] means "all general cards from this strategy" (no topic filter applied).
DECK_META = {
    # Savings & Cash
    "savings_core":      {"label": "Core Savings",      "strategy": "savings",      "topics": [],                 "description": "Foundational savings, budgeting and cash management.", "unlock_at": 0},
    # Fixed Income
    "bonds_core":        {"label": "Bond Markets",       "strategy": "bonds",        "topics": ["bonds"],          "description": "Government and corporate debt, yield curves and credit.",  "unlock_at": 20},
    # Equities
    "stocks_core":       {"label": "Equity Markets",     "strategy": "stocks",       "topics": ["stocks"],         "description": "Public equities, valuation and market dynamics.",          "unlock_at": 40},
    "crypto_deck":       {"label": "Cryptocurrency",     "strategy": "stocks",       "topics": ["crypto"],         "description": "Digital assets, blockchain technology and volatility.",    "unlock_at": 52},
    # Index Funds
    "index_core":        {"label": "Index & ETFs",       "strategy": "index",        "topics": [],                 "description": "Passive investing, broad market exposure and ETFs.",       "unlock_at": 70},
    "real_estate_deck":  {"label": "Real Estate",        "strategy": "index",        "topics": ["real_estate"],    "description": "Property, REITs and real asset investing.",                "unlock_at": 78},
    # Alternatives
    "derivatives_deck":  {"label": "Derivatives",        "strategy": "alternatives", "topics": ["derivatives"],    "description": "Options, futures and structured financial products.",      "unlock_at": 100},
    # Shop Decks
    "great_depression_deck": {
        "label": "Great Depression",
        "strategy": "savings",
        "topics": ["great_depression"],
        "description": "1920s-1930s crisis decisions, policy responses, and global spillovers.",
        "unlock_at": 9_999,
        "shop_price": 5000,
        "is_purchasable": True,
        "card_style": "old",
    },
}

DECKS = list(DECK_META.keys())


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
    unlocked_decks: Mapped[list] = mapped_column(JSON, nullable=True)   # nullable for migration
    enabled_decks: Mapped[list] = mapped_column(JSON, nullable=True)    # nullable for migration
    total_cards_played: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
