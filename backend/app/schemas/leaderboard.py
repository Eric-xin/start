from pydantic import BaseModel


class LeaderboardEntryOut(BaseModel):
    """A single entry in the leaderboard"""

    rank: int
    user_id: str
    username: str
    net_worth: float
    investor_rank: int
    total_cards_played: int
    portfolio_id: str


class LeaderboardOut(BaseModel):
    """The full leaderboard response"""

    entries: list[LeaderboardEntryOut]
    current_user_rank: int | None
