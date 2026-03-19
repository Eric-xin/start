"""Seed leaderboard with demo users for testing."""

import uuid
import random
from datetime import datetime, timezone
from sqlalchemy import select

from app.database import AsyncSessionLocal

# Import all models to ensure relationships are properly initialized
import app.models
from app.models.user import User
from app.models.portfolio import UserPortfolio


async def seed_leaderboard_users():
    """Create 4-5 demo users with random net worth between 2k-10k for leaderboard testing."""

    async with AsyncSessionLocal() as db:
        # Demo user templates: (username, email, stage, investor_rank)
        demo_user_templates = [
            ("AlexTrader", "alex@example.com", 2, 1),
            ("JessicaGains", "jessica@example.com", 2, 1),
            ("MarcusInvest", "marcus@example.com", 3, 2),
            ("EmilyCash", "emily@example.com", 2, 1),
            ("SamuelStocks", "samuel@example.com", 3, 2),
        ]

        # Randomly select 4-5 users
        num_users = random.randint(4, 5)
        selected_users = random.sample(demo_user_templates, num_users)

        # Generate random net worth values between 2k-10k in descending order for ranking
        net_worths = sorted(
            [random.uniform(2000, 10000) for _ in range(num_users)], reverse=True
        )

        for idx, (username, email, stage, investor_rank) in enumerate(selected_users):
            # Check if user already exists
            user_query = select(User).where(User.username == username)
            result = await db.execute(user_query)
            existing_user = result.scalar_one_or_none()

            if not existing_user:
                net_worth = net_worths[idx]
                # Create user
                user = User(
                    id=uuid.uuid4(),
                    username=username,
                    email=email,
                    password_hash="demo",  # Placeholder
                    is_verified=True,
                    created_at=datetime.now(timezone.utc),
                )
                db.add(user)
                await db.flush()

                # Create portfolio for user
                portfolio = UserPortfolio(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    capital=10_000.0,
                    net_worth=net_worth,
                    peak_net_worth=net_worth,
                    total_income_received=max(0, net_worth - 10_000.0),
                    stage=stage,
                    investor_rank=investor_rank,
                    total_cards_played=random.randint(10, 100),
                    topic_mastery={},
                    portfolio_weights={},
                    market_state={},
                    last_income_date=None,
                    income_streak=0,
                    persona_id=None,
                    persona_vector=None,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
                db.add(portfolio)
                print(f"Created demo user: {username} with net worth CHF{net_worth:,.2f}")
            else:
                print(f"User {username} already exists, skipping...")

        await db.commit()

    print("Leaderboard seeding complete!")
