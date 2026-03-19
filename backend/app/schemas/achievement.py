from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class AchievementOut(BaseModel):
    id: str
    key: str
    category: str
    title: str
    description: str
    emoji: str
    tier: str
    condition_type: str
    condition_value: float
    unlocked: bool = False
    unlocked_at: Optional[str] = None


class UserAchievementOut(BaseModel):
    achievement: AchievementOut
    unlocked_at: str
