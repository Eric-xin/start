"""Seed script — run directly or called from app startup."""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import AsyncSessionLocal, engine, Base
from app.models.card import Card
from app.models.game import GameConfig
from app.models.achievement import Achievement
from app.seeds.cards import SEED_CARDS
from app.seeds.achievements import SEED_ACHIEVEMENTS

DEFAULT_CONFIGS = [
    {
        "key": "persona_update_rates",
        "value": {"decay": 0.98, "event": 0.06, "action": 0.08, "state": 0.04, "reward": 0.02},
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


async def seed_cards(db: AsyncSession) -> int:
    result = await db.execute(select(Card).limit(1))
    if result.scalar_one_or_none():
        return 0  # already seeded

    seeded = 0
    for card_data in SEED_CARDS:
        card = Card(**card_data)
        db.add(card)
        seeded += 1
    return seeded


async def seed_configs(db: AsyncSession) -> int:
    seeded = 0
    for cfg_data in DEFAULT_CONFIGS:
        result = await db.execute(select(GameConfig).where(GameConfig.key == cfg_data["key"]))
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
        cards_seeded = await seed_cards(db)
        configs_seeded = await seed_configs(db)
        achievements_seeded = await seed_achievements(db)
        await db.commit()
        print(f"Seeded {cards_seeded} cards, {configs_seeded} configs, {achievements_seeded} achievements.")


if __name__ == "__main__":
    asyncio.run(run_seeds())
