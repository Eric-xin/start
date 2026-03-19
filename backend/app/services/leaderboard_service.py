"""Leaderboard service — ranking by net worth."""

from typing import Optional
import uuid

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.portfolio import UserPortfolio
from app.schemas.leaderboard import LeaderboardEntryOut, LeaderboardOut
from app.services.portfolio_service import get_or_create_portfolio


async def get_leaderboard(
    db: AsyncSession, current_user_id: Optional[uuid.UUID] = None, limit: int = 50
) -> LeaderboardOut:
    """
    Get the top portfolios ranked by net worth.
    """
    # Ensure the authenticated user has a portfolio so they can be ranked.
    if current_user_id:
        await get_or_create_portfolio(db, current_user_id)

    # Fetch all portfolios with their users, sorted by net worth
    query = (
        select(UserPortfolio)
        .options(selectinload(UserPortfolio.user))
        .order_by(desc(UserPortfolio.net_worth))
        .limit(limit)
    )
    result = await db.execute(query)
    portfolios = result.scalars().all()

    # Create entries
    entries: list[LeaderboardEntryOut] = []

    for idx, portfolio in enumerate(portfolios, 1):
        entry = LeaderboardEntryOut(
            rank=idx,
            user_id=str(portfolio.user_id),
            username=portfolio.user.username if portfolio.user else "Anonymous",
            net_worth=portfolio.net_worth,
            investor_rank=portfolio.investor_rank,
            total_cards_played=portfolio.total_cards_played,
            portfolio_id=str(portfolio.id),
        )
        entries.append(entry)

    # Find current user's rank
    current_user_rank: Optional[int] = None
    if current_user_id:
        for entry in entries:
            if uuid.UUID(entry.user_id) == current_user_id:
                current_user_rank = entry.rank
                break

    return LeaderboardOut(entries=entries, current_user_rank=current_user_rank)
