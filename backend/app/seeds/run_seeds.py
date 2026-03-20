"""Seed script — run directly or called from app startup."""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import AsyncSessionLocal, engine, Base

# Import all models to ensure relationships are properly initialized
import app.models
from app.models.card import Card
from app.models.game import GameConfig
from app.models.achievement import Achievement
from app.seeds.cards import SEED_CARDS
from app.seeds.achievements import SEED_ACHIEVEMENTS
from app.seeds.seed_leaderboard import seed_leaderboard_users

SMTP_CONFIGS = [
    {
        "key": "smtp_host",
        "value": "smtp.mailtrap.io",
        "description": "SMTP server hostname",
    },
    {"key": "smtp_port", "value": 587, "description": "SMTP server port"},
    {"key": "smtp_user", "value": "", "description": "SMTP username / API key"},
    {"key": "smtp_password", "value": "", "description": "SMTP password"},
    {
        "key": "smtp_from",
        "value": "noreply@markethand.app",
        "description": "From email address",
    },
    {"key": "smtp_from_name", "value": "MarketHand", "description": "From display name"},
    {
        "key": "email_backend",
        "value": "console",
        "description": "Email backend: 'console' (logs only) or 'smtp' (sends real email)",
    },
]

DEFAULT_CONFIGS = [
    {
        "key": "persona_update_rates",
        "value": {
            "decay": 0.98,
            "event": 0.06,
            "action": 0.08,
            "state": 0.04,
            "reward": 0.02,
        },
        "description": "Weights for persona vector update equation",
    },
    {
        "key": "score_weights",
        "value": {
            "education": {"stage": 0.35, "learn": 0.35, "persona": 0.05},
            "event": {"stage": 0.20, "learn": 0.20, "persona": 0.20, "timing": 0.25},
            "action": {"stage": 0.15, "learn": 0.15, "persona": 0.30, "timing": 0.20},
        },
        "description": "Card scoring weight matrices by card type",
    },
    {
        "key": "stage_progression_threshold",
        "value": 0.85,
        "description": "Progress score required to advance to next stage",
    },
    {
        "key": "investor_rank_thresholds",
        "value": {
            "2": {"stage": 2, "capital": 11000},
            "3": {"stage": 3, "capital": 13000},
            "4": {"stage": 5, "capital": 16000},
        },
        "description": "Stage and capital thresholds to unlock investor ranks 2-4",
    },
]


def _normalize_surrogate_strings(value):
    """Convert surrogate-escaped strings to valid Unicode for DB writes."""
    if isinstance(value, str):
        try:
            return value.encode("utf-16", "surrogatepass").decode("utf-16")
        except UnicodeError:
            return value
    if isinstance(value, list):
        return [_normalize_surrogate_strings(item) for item in value]
    if isinstance(value, dict):
        return {k: _normalize_surrogate_strings(v) for k, v in value.items()}
    return value


async def seed_cards(db: AsyncSession) -> tuple[int, int]:
    """Insert missing cards and refresh existing seed cards by card_id."""
    result = await db.execute(select(Card))
    existing_cards = {card.card_id: card for card in result.scalars().all()}

    inserted = 0
    updated = 0

    for card_data in SEED_CARDS:
        normalized_card_data = _normalize_surrogate_strings(card_data)
        existing = existing_cards.get(normalized_card_data["card_id"])
        if existing is None:
            db.add(Card(**normalized_card_data))
            inserted += 1
            continue

        for field, value in normalized_card_data.items():
            setattr(existing, field, value)
        updated += 1

    return inserted, updated


async def seed_configs(db: AsyncSession) -> int:
    seeded = 0
    for cfg_data in DEFAULT_CONFIGS + SMTP_CONFIGS:
        result = await db.execute(
            select(GameConfig).where(GameConfig.key == cfg_data["key"])
        )
        if not result.scalar_one_or_none():
            config = GameConfig(**cfg_data)
            db.add(config)
            seeded += 1
    return seeded


async def seed_achievements(db: AsyncSession) -> int:
    result = await db.execute(select(Achievement).limit(1))
    if result.scalar_one_or_none():
        return 0
    seeded = 0
    for ach_data in SEED_ACHIEVEMENTS:
        db.add(Achievement(**ach_data))
        seeded += 1
    return seeded


async def run_seeds():
    async with AsyncSessionLocal() as db:
        cards_inserted, cards_updated = await seed_cards(db)
        configs_seeded = await seed_configs(db)
        achievements_seeded = await seed_achievements(db)
        await db.commit()
        print(
            f"Cards inserted: {cards_inserted}, cards updated: {cards_updated}, "
            f"configs seeded: {configs_seeded}, achievements seeded: {achievements_seeded}."
        )

    # Seed leaderboard users
    await seed_leaderboard_users()


if __name__ == "__main__":
    asyncio.run(run_seeds())
