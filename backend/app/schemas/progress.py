from pydantic import BaseModel


class StrategyInfo(BaseModel):
    key: str
    label: str
    stage: int
    unlock_at: int
    is_unlocked: bool
    is_enabled: bool


class DeckInfo(BaseModel):
    key: str
    label: str
    strategy: str
    description: str
    unlock_at: int
    is_unlocked: bool
    is_enabled: bool
    is_purchasable: bool = False
    shop_price: int | None = None
    card_style: str | None = None


class UserProgressOut(BaseModel):
    unlocked_strategies: list[str]
    enabled_strategies: list[str]
    unlocked_decks: list[str]
    enabled_decks: list[str]
    total_cards_played: int
    strategies: list[StrategyInfo]
    decks: list[DeckInfo]


class UserProgressUpdate(BaseModel):
    enabled_strategies: list[str] | None = None
    enabled_decks: list[str] | None = None


class PurchaseDeckRequest(BaseModel):
    deck_key: str


class PurchaseDeckResponse(BaseModel):
    progress: UserProgressOut
    remaining_capital: float
    remaining_net_worth: float
    purchased_deck_key: str
