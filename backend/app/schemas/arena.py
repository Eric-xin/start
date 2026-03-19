from __future__ import annotations
import uuid
from datetime import datetime
from pydantic import BaseModel, field_serializer
from app.models.arena import ArenaStatus, ArenaPlayerStatus


class CreateRoomRequest(BaseModel):
    round_count: int = 10
    starting_capital: float = 10_000.0
    max_players: int = 8


class JoinRoomRequest(BaseModel):
    pass


class ArenaPlayerOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    username: str
    capital: float
    status: ArenaPlayerStatus
    is_host: bool
    joined_at: datetime

    @field_serializer("id", "user_id")
    def serialize_uuid(self, v: uuid.UUID) -> str:
        return str(v)


class ArenaRoundPlayOut(BaseModel):
    model_config = {"from_attributes": True}

    player_id: uuid.UUID
    round_number: int
    action: str
    reward: float
    capital_before: float
    capital_after: float

    @field_serializer("player_id")
    def serialize_uuid(self, v: uuid.UUID) -> str:
        return str(v)


class ArenaRoomOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    code: str
    host_user_id: uuid.UUID
    status: ArenaStatus
    round_count: int
    current_round: int
    starting_capital: float
    max_players: int
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None
    players: list[ArenaPlayerOut] = []

    @field_serializer("id", "host_user_id")
    def serialize_uuid(self, v: uuid.UUID) -> str:
        return str(v)


class PlayArenaCardRequest(BaseModel):
    action: str  # "left" or "right"


class RoundResult(BaseModel):
    player_id: str
    username: str
    capital_before: float
    capital_after: float
    capital_delta: float
    action: str
    reward: float
    rank: int


class RoundCompletePayload(BaseModel):
    round_number: int
    results: list[RoundResult]
    is_final: bool
