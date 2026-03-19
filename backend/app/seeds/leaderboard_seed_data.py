"""Leaderboard seed data — demo users with random net worth between 2k-10k."""

import random
from typing import TypedDict

random.seed(42)  # For reproducible data


class LeaderboardUserData(TypedDict):
    """Structure for leaderboard seed user data."""

    username: str
    email: str
    net_worth: float
    investor_rank: int
    stage: int
    total_cards_played: int


def generate_leaderboard_users() -> list[LeaderboardUserData]:
    """Generate 4-5 demo users with random net worth between 2k-10k."""
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

    leaderboard_users: list[LeaderboardUserData] = []
    for idx, (username, email, stage, investor_rank) in enumerate(selected_users):
        net_worth = net_worths[idx]
        leaderboard_users.append(
            {
                "username": username,
                "email": email,
                "net_worth": net_worth,
                "investor_rank": investor_rank,
                "stage": stage,
                "total_cards_played": random.randint(10, 100),
            }
        )

    return leaderboard_users


# Pre-generated leaderboard seed data (4-5 users with net worth 2k-10k)
SEED_LEADERBOARD_USERS = generate_leaderboard_users()
