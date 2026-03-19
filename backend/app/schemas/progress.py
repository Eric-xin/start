from pydantic import BaseModel


class StrategyInfo(BaseModel):
    key: str
    label: str
    stage: int
    unlock_at: int
    is_unlocked: bool
    is_enabled: bool


class UserProgressOut(BaseModel):
    unlocked_strategies: list[str]
    enabled_strategies: list[str]
    total_cards_played: int
    strategies: list[StrategyInfo]


class UserProgressUpdate(BaseModel):
    enabled_strategies: list[str] | None = None
