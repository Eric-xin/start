"""Persona management — CRUD + trajectory + interpretation."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.persona import Persona, PersonaSnapshot
from app.models.user import User
from app.schemas.persona import PersonaCreate, PersonaUpdate, PersonaOut, PersonaTrajectoryOut, PersonaSnapshotOut, TraitsOut
from app.services import persona_engine as pe
from app.services.game_service import get_or_create_default_persona
from app.core.dependencies import get_current_active_user
import numpy as np

router = APIRouter(prefix="/api/personas", tags=["personas"])


def _enrich_persona(persona: Persona) -> PersonaOut:
    """Attach computed traits + interpretation to a PersonaOut."""
    p = np.array(persona.vector, dtype=np.float32)
    traits_dict = pe.compute_traits(p)
    interpretation = pe.interpret_persona(traits_dict)
    return PersonaOut(
        id=persona.id,
        user_id=persona.user_id,
        name=persona.name,
        cards_played=persona.cards_played,
        is_active=persona.is_active,
        traits=TraitsOut(**traits_dict),
        interpretation=interpretation,
        created_at=persona.created_at,
        updated_at=persona.updated_at,
    )


@router.get("", response_model=list[PersonaOut])
async def list_personas(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Persona)
        .where(Persona.user_id == current_user.id)
        .order_by(Persona.created_at.asc())
    )
    personas = result.scalars().all()
    return [_enrich_persona(p) for p in personas]


@router.post("", response_model=PersonaOut, status_code=201)
async def create_persona(
    data: PersonaCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    persona = Persona(
        user_id=current_user.id,
        name=data.name,
        vector=pe.initialize_persona(),
        cards_played=0,
        is_active=False,  # new personas start inactive
    )
    db.add(persona)
    await db.commit()
    await db.refresh(persona)
    return _enrich_persona(persona)


@router.get("/{persona_id}", response_model=PersonaOut)
async def get_persona(
    persona_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Persona).where(Persona.id == persona_id, Persona.user_id == current_user.id)
    )
    persona = result.scalar_one_or_none()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return _enrich_persona(persona)


@router.put("/{persona_id}", response_model=PersonaOut)
async def update_persona(
    persona_id: uuid.UUID,
    data: PersonaUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Persona).where(Persona.id == persona_id, Persona.user_id == current_user.id)
    )
    persona = result.scalar_one_or_none()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    if data.name is not None:
        persona.name = data.name

    if data.is_active is True:
        # Deactivate all other personas first
        all_result = await db.execute(
            select(Persona).where(Persona.user_id == current_user.id, Persona.id != persona_id)
        )
        for other in all_result.scalars().all():
            other.is_active = False
        persona.is_active = True
    elif data.is_active is False:
        persona.is_active = False

    await db.commit()
    await db.refresh(persona)
    return _enrich_persona(persona)


@router.delete("/{persona_id}", status_code=204)
async def delete_persona(
    persona_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Persona).where(Persona.id == persona_id, Persona.user_id == current_user.id)
    )
    persona = result.scalar_one_or_none()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    # Count total personas
    count_result = await db.execute(
        select(Persona).where(Persona.user_id == current_user.id)
    )
    all_personas = count_result.scalars().all()
    if len(all_personas) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last persona")
    if persona.is_active:
        raise HTTPException(status_code=400, detail="Cannot delete the active persona. Activate another first.")

    await db.delete(persona)
    await db.commit()


@router.get("/{persona_id}/trajectory", response_model=PersonaTrajectoryOut)
async def get_trajectory(
    persona_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Persona).where(Persona.id == persona_id, Persona.user_id == current_user.id)
    )
    persona = result.scalar_one_or_none()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    snap_result = await db.execute(
        select(PersonaSnapshot)
        .where(PersonaSnapshot.persona_id == persona_id)
        .order_by(PersonaSnapshot.cards_played.asc())
    )
    snapshots = snap_result.scalars().all()

    # Also include current state as a "snapshot"
    all_vectors = [s.vector for s in snapshots]
    all_vectors.append(list(persona.vector))  # current

    # Compute PCA over all vectors
    pca_coords, var_explained = pe.compute_pca_2d(all_vectors)

    snapshot_outs = []
    for i, snap in enumerate(snapshots):
        x, y = pca_coords[i] if i < len(pca_coords) else (0.0, 0.0)
        snapshot_outs.append(PersonaSnapshotOut(
            id=snap.id,
            persona_id=snap.persona_id,
            cards_played=snap.cards_played,
            traits=snap.traits,
            pca_x=x,
            pca_y=y,
            created_at=snap.created_at,
        ))

    return PersonaTrajectoryOut(
        persona_id=persona_id,
        snapshots=snapshot_outs,
        pca_variance_explained=var_explained,
    )
