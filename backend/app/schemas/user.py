import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole, SubscriptionTier


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: EmailStr
    username: str
    role: UserRole
    subscription_tier: SubscriptionTier
    is_verified: bool
    created_at: datetime


class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
