import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.game import GameSession
from app.models.user import User
from app.schemas.game import TraitsOut
from app.services.persona_engine import compute_traits
from app.core.dependencies import get_current_active_user
import numpy as np

router = APIRouter(prefix="/api/persona", tags=["persona"])


@router.get("/{session_id}", response_model=TraitsOut)
async def get_persona(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GameSession).where(
            GameSession.id == session_id,
            GameSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    p = np.array(session.persona_vector, dtype=np.float32)
    traits = compute_traits(p)
    return TraitsOut(**traits)
