"""Arena service — multiplayer turn-based game sessions."""

import json
import random
import string
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import WebSocket

from app.models.arena import ArenaRoom, ArenaPlayer, ArenaRoundPlay, ArenaStatus, ArenaPlayerStatus
from app.models.card import Card
from app.models.user import User
from app.schemas.arena import ArenaRoomOut, RoundResult, RoundCompletePayload
from app.schemas.card import CardOut
from app.services.portfolio_service import (
    _compute_reward,
    _update_market_state,
    _compute_market_multiplier,
    resolve_card,
)

# ─── Connection Manager ────────────────────────────────────────────────────────

class ArenaConnectionManager:
    """In-memory WebSocket connection manager per room."""

    def __init__(self):
        # room_code → {user_id_str: WebSocket}
        self._rooms: dict[str, dict[str, WebSocket]] = {}

    def connect(self, code: str, user_id: str, ws: WebSocket):
        if code not in self._rooms:
            self._rooms[code] = {}
        self._rooms[code][user_id] = ws

    def disconnect(self, code: str, user_id: str):
        if code in self._rooms:
            self._rooms[code].pop(user_id, None)
            if not self._rooms[code]:
                del self._rooms[code]

    async def broadcast(self, code: str, message: dict):
        room_conns = self._rooms.get(code, {})
        dead = []
        for uid, ws in room_conns.items():
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(uid)
        for uid in dead:
            self.disconnect(code, uid)

    async def send_to(self, code: str, user_id: str, message: dict):
        ws = self._rooms.get(code, {}).get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(code, user_id)

    def connected_user_ids(self, code: str) -> set[str]:
        return set(self._rooms.get(code, {}).keys())


arena_manager = ArenaConnectionManager()


# ─── Room Code ─────────────────────────────────────────────────────────────────


def _generate_code(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


async def _unique_code(db: AsyncSession) -> str:
    for _ in range(10):
        code = _generate_code()
        result = await db.execute(select(ArenaRoom).where(ArenaRoom.code == code))
        if not result.scalar_one_or_none():
            return code
    raise RuntimeError("Failed to generate unique room code")


# ─── Card Sequence ─────────────────────────────────────────────────────────────


async def _build_card_sequence(db: AsyncSession, count: int) -> list[str]:
    """Select `count` random active cards for the arena sequence."""
    result = await db.execute(select(Card).where(Card.is_active == True))  # noqa: E712
    cards = result.scalars().all()
    if not cards:
        return []
    chosen = random.choices(cards, k=count)
    return [str(c.id) for c in chosen]


# ─── Room CRUD ─────────────────────────────────────────────────────────────────


async def create_room(
    db: AsyncSession,
    host: User,
    round_count: int,
    starting_capital: float,
    max_players: int,
) -> ArenaRoom:
    code = await _unique_code(db)
    card_ids = await _build_card_sequence(db, round_count)

    room = ArenaRoom(
        code=code,
        host_user_id=host.id,
        round_count=round_count,
        starting_capital=starting_capital,
        card_sequence=card_ids,
        max_players=max_players,
    )
    db.add(room)
    await db.flush()

    player = ArenaPlayer(
        room_id=room.id,
        user_id=host.id,
        username=host.username,
        capital=starting_capital,
        is_host=True,
    )
    db.add(player)
    await db.commit()
    await db.refresh(room, ["players"])
    return room


async def join_room(db: AsyncSession, room: ArenaRoom, user: User) -> ArenaPlayer:
    # Check if already joined
    result = await db.execute(
        select(ArenaPlayer).where(
            ArenaPlayer.room_id == room.id,
            ArenaPlayer.user_id == user.id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    if room.status != ArenaStatus.waiting:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Game already started")

    # Count active players
    result = await db.execute(
        select(ArenaPlayer).where(ArenaPlayer.room_id == room.id)
    )
    players = result.scalars().all()
    if len(players) >= room.max_players:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Room is full")

    player = ArenaPlayer(
        room_id=room.id,
        user_id=user.id,
        username=user.username,
        capital=room.starting_capital,
    )
    db.add(player)
    await db.commit()
    await db.refresh(player)
    return player


async def get_room_by_code(db: AsyncSession, code: str) -> ArenaRoom | None:
    result = await db.execute(
        select(ArenaRoom)
        .where(ArenaRoom.code == code.upper())
        .options(selectinload(ArenaRoom.players))
    )
    return result.scalar_one_or_none()


async def get_room_players(db: AsyncSession, room_id: uuid.UUID) -> list[ArenaPlayer]:
    result = await db.execute(
        select(ArenaPlayer).where(ArenaPlayer.room_id == room_id)
    )
    return result.scalars().all()


# ─── Game Flow ─────────────────────────────────────────────────────────────────


async def start_game(db: AsyncSession, room: ArenaRoom, user: User) -> ArenaRoom:
    from fastapi import HTTPException
    if str(room.host_user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Only host can start the game")
    if room.status != ArenaStatus.waiting:
        raise HTTPException(status_code=400, detail="Game already started or finished")

    result = await db.execute(
        select(ArenaPlayer).where(ArenaPlayer.room_id == room.id)
    )
    players = result.scalars().all()
    if len(players) < 1:
        raise HTTPException(status_code=400, detail="Need at least 1 player")

    room.status = ArenaStatus.playing
    room.current_round = 1
    room.started_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(room, ["players"])
    return room


async def get_current_card(db: AsyncSession, room: ArenaRoom) -> CardOut | None:
    """Return the card for the current round."""
    if room.current_round < 1 or room.current_round > len(room.card_sequence):
        return None
    card_id_str = room.card_sequence[room.current_round - 1]
    result = await db.execute(select(Card).where(Card.id == uuid.UUID(card_id_str)))
    card = result.scalar_one_or_none()
    return resolve_card(card) if card else None


async def play_arena_card(
    db: AsyncSession,
    room: ArenaRoom,
    player: ArenaPlayer,
    action: str,
) -> dict:
    from fastapi import HTTPException

    if room.status != ArenaStatus.playing:
        raise HTTPException(status_code=400, detail="Game not in progress")
    if action not in ("left", "right"):
        raise HTTPException(status_code=400, detail="Invalid action")

    round_num = room.current_round

    # Check player hasn't already played this round
    result = await db.execute(
        select(ArenaRoundPlay).where(
            ArenaRoundPlay.room_id == room.id,
            ArenaRoundPlay.player_id == player.id,
            ArenaRoundPlay.round_number == round_num,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already played this round")

    # Load card
    card_id_str = room.card_sequence[round_num - 1]
    result = await db.execute(select(Card).where(Card.id == uuid.UUID(card_id_str)))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Compute reward (simplified — no market state in arena)
    reward = _compute_reward(card, action, {})
    capital_before = player.capital
    alpha = getattr(card, "alpha", 1.0)
    capital_delta = reward * 200 * alpha
    player.capital = max(player.capital + capital_delta, 100.0)

    # Record play
    play = ArenaRoundPlay(
        room_id=room.id,
        player_id=player.id,
        round_number=round_num,
        card_id=card.id,
        action=action,
        reward=reward,
        capital_before=capital_before,
        capital_after=player.capital,
    )
    db.add(play)
    await db.commit()
    await db.refresh(player)

    # Check if all active players have played this round
    all_players_result = await db.execute(
        select(ArenaPlayer).where(
            ArenaPlayer.room_id == room.id,
            ArenaPlayer.status != ArenaPlayerStatus.disconnected,
        )
    )
    all_players = all_players_result.scalars().all()

    plays_result = await db.execute(
        select(ArenaRoundPlay).where(
            ArenaRoundPlay.room_id == room.id,
            ArenaRoundPlay.round_number == round_num,
        )
    )
    round_plays = plays_result.scalars().all()
    played_player_ids = {str(p.player_id) for p in round_plays}
    all_played = all(str(p.id) in played_player_ids for p in all_players)

    if all_played:
        return await _finalize_round(db, room, all_players, round_plays, round_num)

    return {
        "status": "waiting",
        "played_count": len(played_player_ids),
        "total_count": len(all_players),
        "reward": reward,
        "capital_after": player.capital,
    }


async def _finalize_round(
    db: AsyncSession,
    room: ArenaRoom,
    players: list[ArenaPlayer],
    round_plays: list[ArenaRoundPlay],
    round_num: int,
) -> dict:
    """Advance room to next round and build results payload."""
    # Build results sorted by capital descending
    play_by_player = {str(p.player_id): p for p in round_plays}
    player_by_id = {str(p.id): p for p in players}

    results_raw = []
    for pid_str, p in player_by_id.items():
        play = play_by_player.get(pid_str)
        if play:
            results_raw.append({
                "player_id": pid_str,
                "username": p.username,
                "capital_before": play.capital_before,
                "capital_after": play.capital_after,
                "capital_delta": play.capital_after - play.capital_before,
                "action": play.action,
                "reward": play.reward,
            })

    results_raw.sort(key=lambda x: x["capital_after"], reverse=True)
    results = [RoundResult(**r, rank=i + 1) for i, r in enumerate(results_raw)]

    is_final = round_num >= room.round_count
    if is_final:
        room.status = ArenaStatus.finished
        room.current_round = round_num
        room.finished_at = datetime.now(timezone.utc)
    else:
        room.current_round = round_num + 1

    await db.commit()
    await db.refresh(room)

    return {
        "status": "round_complete",
        "round_number": round_num,
        "results": [r.model_dump() for r in results],
        "is_final": is_final,
    }


# ─── WS Broadcast Helpers ─────────────────────────────────────────────────────


async def broadcast_room_state(db: AsyncSession, room: ArenaRoom):
    """Send full room state to all connected players."""
    await db.refresh(room)
    result = await db.execute(
        select(ArenaPlayer).where(ArenaPlayer.room_id == room.id)
    )
    players = result.scalars().all()

    player_data = [
        {
            "id": str(p.id),
            "user_id": str(p.user_id),
            "username": p.username,
            "capital": p.capital,
            "status": p.status.value,
            "is_host": p.is_host,
        }
        for p in players
    ]

    await arena_manager.broadcast(room.code, {
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


async def broadcast_round_start(db: AsyncSession, room: ArenaRoom):
    """Send card for the current round to all connected players."""
    card_out = await get_current_card(db, room)
    if not card_out:
        return
    await arena_manager.broadcast(room.code, {
        "type": "round_start",
        "round_number": room.current_round,
        "total_rounds": room.round_count,
        "card": card_out.model_dump(),
    })


async def broadcast_round_complete(room_code: str, payload: dict):
    await arena_manager.broadcast(room_code, {
        "type": "round_complete",
        **payload,
    })


async def broadcast_game_over(db: AsyncSession, room: ArenaRoom):
    result = await db.execute(
        select(ArenaPlayer).where(ArenaPlayer.room_id == room.id)
    )
    players = sorted(result.scalars().all(), key=lambda p: p.capital, reverse=True)
    standings = [
        {
            "rank": i + 1,
            "player_id": str(p.id),
            "user_id": str(p.user_id),
            "username": p.username,
            "capital": p.capital,
            "capital_delta": p.capital - room.starting_capital,
        }
        for i, p in enumerate(players)
    ]
    await arena_manager.broadcast(room.code, {
        "type": "game_over",
        "standings": standings,
    })
