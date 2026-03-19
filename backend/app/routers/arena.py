"""Arena router — multiplayer game rooms with WebSocket real-time sync."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError

from app.database import get_db
from app.core.dependencies import get_current_active_user
from app.core.security import decode_token
from app.models.user import User
from app.models.arena import ArenaRoom, ArenaPlayer, ArenaStatus, ArenaPlayerStatus
from app.schemas.arena import (
    CreateRoomRequest,
    ArenaRoomOut,
    PlayArenaCardRequest,
)
from app.services import arena_service as svc
from sqlalchemy import select

router = APIRouter(prefix="/api/arena", tags=["arena"])


# ─── REST Endpoints ────────────────────────────────────────────────────────────


@router.post("/rooms", response_model=ArenaRoomOut)
async def create_room(
    body: CreateRoomRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    room = await svc.create_room(
        db,
        host=user,
        round_count=max(1, min(body.round_count, 50)),
        starting_capital=max(1_000.0, min(body.starting_capital, 1_000_000.0)),
        max_players=max(2, min(body.max_players, 16)),
    )
    return room


@router.get("/rooms/{code}", response_model=ArenaRoomOut)
async def get_room(
    code: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    room = await svc.get_room_by_code(db, code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.post("/rooms/{code}/join", response_model=ArenaRoomOut)
async def join_room(
    code: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    room = await svc.get_room_by_code(db, code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    await svc.join_room(db, room, user)
    await db.refresh(room, ["players"])

    # Notify all players in the room
    await svc.broadcast_room_state(db, room)
    return room


@router.post("/rooms/{code}/start", response_model=ArenaRoomOut)
async def start_game(
    code: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    room = await svc.get_room_by_code(db, code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room = await svc.start_game(db, room, user)

    # Broadcast room state update then send first card
    await svc.broadcast_room_state(db, room)
    await svc.broadcast_round_start(db, room)
    return room


@router.post("/rooms/{code}/play")
async def play_card(
    code: str,
    body: PlayArenaCardRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    room = await svc.get_room_by_code(db, code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Get player record
    result = await db.execute(
        select(ArenaPlayer).where(
            ArenaPlayer.room_id == room.id,
            ArenaPlayer.user_id == user.id,
        )
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=403, detail="You are not in this room")

    play_result = await svc.play_arena_card(db, room, player, body.action)

    # Notify all players someone played
    await svc.arena_manager.broadcast(code, {
        "type": "player_played",
        "player_id": str(player.id),
        "username": player.username,
        "round_number": room.current_round if play_result["status"] == "waiting" else play_result.get("round_number", room.current_round),
        "played_count": play_result.get("played_count", 0),
        "total_count": play_result.get("total_count", 0),
    })

    if play_result["status"] == "round_complete":
        await db.refresh(room)
        await svc.broadcast_round_complete(code, play_result)

        if play_result["is_final"]:
            await svc.broadcast_game_over(db, room)
        else:
            # Send next round card
            await svc.broadcast_round_start(db, room)

    return play_result


# ─── WebSocket ─────────────────────────────────────────────────────────────────


@router.websocket("/ws/{code}")
async def arena_ws(
    code: str,
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    # Authenticate via token query param
    try:
        payload = decode_token(token)
        user_id_raw = payload.get("sub")
        if not user_id_raw:
            await websocket.close(code=4001)
            return
        user_id = uuid.UUID(user_id_raw)
    except (JWTError, ValueError):
        await websocket.close(code=4001)
        return

    # Load user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        await websocket.close(code=4001)
        return

    # Load room
    room = await svc.get_room_by_code(db, code)
    if not room:
        await websocket.close(code=4004)
        return

    # Check player is in room
    result = await db.execute(
        select(ArenaPlayer).where(
            ArenaPlayer.room_id == room.id,
            ArenaPlayer.user_id == user.id,
        )
    )
    player = result.scalar_one_or_none()
    if not player:
        await websocket.close(code=4003)
        return

    await websocket.accept()
    svc.arena_manager.connect(code, str(user.id), websocket)

    # Update player status to ready
    player.status = ArenaPlayerStatus.ready
    await db.commit()

    # Send current room state to newly connected player
    await db.refresh(room)
    result2 = await db.execute(
        select(ArenaPlayer).where(ArenaPlayer.room_id == room.id)
    )
    all_players = result2.scalars().all()
    player_data = [
        {
            "id": str(p.id),
            "user_id": str(p.user_id),
            "username": p.username,
            "capital": p.capital,
            "status": p.status.value,
            "is_host": p.is_host,
        }
        for p in all_players
    ]
    await websocket.send_json({
        "type": "room_state",
        "room": {
            "code": room.code,
            "status": room.status.value,
            "round_count": room.round_count,
            "current_round": room.current_round,
            "starting_capital": room.starting_capital,
            "max_players": room.max_players,
        },
        "players": player_data,
    })

    # If game is already running, send current card
    if room.status == ArenaStatus.playing:
        card_out = await svc.get_current_card(db, room)
        if card_out:
            await websocket.send_json({
                "type": "round_start",
                "round_number": room.current_round,
                "total_rounds": room.round_count,
                "card": card_out.model_dump(),
            })

    # Notify others someone connected
    await svc.arena_manager.broadcast(code, {
        "type": "player_connected",
        "player_id": str(player.id),
        "username": player.username,
    })

    try:
        while True:
            # Just keep the connection alive; game actions come via REST
            data = await websocket.receive_text()
            # Handle optional ping/pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        svc.arena_manager.disconnect(code, str(user.id))
        # Mark player as disconnected
        try:
            result = await db.execute(
                select(ArenaPlayer).where(
                    ArenaPlayer.room_id == room.id,
                    ArenaPlayer.user_id == user.id,
                )
            )
            p = result.scalar_one_or_none()
            if p:
                p.status = ArenaPlayerStatus.disconnected
                await db.commit()
        except Exception:
            pass

        await svc.arena_manager.broadcast(code, {
            "type": "player_disconnected",
            "player_id": str(player.id),
            "username": player.username,
        })
