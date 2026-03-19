import uuid
from datetime import datetime
from pydantic import BaseModel


class PersonaCreate(BaseModel):
    name: str = "My Persona"


class PersonaUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class TraitsOut(BaseModel):
    risk_appetite: float
    fomo_sensitivity: float
    loss_aversion: float
    patience: float
    diversification_bias: float
    overconfidence: float


class PersonaSnapshotOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    persona_id: uuid.UUID
    cards_played: int
    traits: dict
    pca_x: float | None = None
    pca_y: float | None = None
    created_at: datetime


class PersonaOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    cards_played: int
    is_active: bool
    traits: TraitsOut | None = None
    interpretation: str | None = None
    created_at: datetime
    updated_at: datetime


class PersonaTrajectoryOut(BaseModel):
    persona_id: uuid.UUID
    snapshots: list[PersonaSnapshotOut]
    pca_variance_explained: list[float]
