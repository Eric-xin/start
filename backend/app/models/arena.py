import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, JSON, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ArenaStatus(str, enum.Enum):
    waiting = "waiting"
    playing = "playing"
    finished = "finished"


class ArenaPlayerStatus(str, enum.Enum):
    joined = "joined"
    ready = "ready"
    disconnected = "disconnected"


class ArenaRoom(Base):
    __tablename__ = "arena_rooms"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(8), unique=True, nullable=False, index=True)
    host_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[ArenaStatus] = mapped_column(
        SAEnum(ArenaStatus), default=ArenaStatus.waiting, nullable=False
    )
    round_count: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    current_round: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    starting_capital: Mapped[float] = mapped_column(Float, default=10_000.0, nullable=False)
    card_sequence: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    max_players: Mapped[int] = mapped_column(Integer, default=8, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    players: Mapped[list["ArenaPlayer"]] = relationship(
        "ArenaPlayer", back_populates="room", cascade="all, delete-orphan"
    )
    round_plays: Mapped[list["ArenaRoundPlay"]] = relationship(
        "ArenaRoundPlay", back_populates="room", cascade="all, delete-orphan"
    )


class ArenaPlayer(Base):
    __tablename__ = "arena_players"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("arena_rooms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    username: Mapped[str] = mapped_column(String(64), nullable=False)
    capital: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[ArenaPlayerStatus] = mapped_column(
        SAEnum(ArenaPlayerStatus), default=ArenaPlayerStatus.joined, nullable=False
    )
    is_host: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    room: Mapped["ArenaRoom"] = relationship("ArenaRoom", back_populates="players")
    plays: Mapped[list["ArenaRoundPlay"]] = relationship(
        "ArenaRoundPlay", back_populates="player", cascade="all, delete-orphan"
    )


class ArenaRoundPlay(Base):
    __tablename__ = "arena_round_plays"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("arena_rooms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    player_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("arena_players.id", ondelete="CASCADE"), nullable=False
    )
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    card_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cards.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(8), nullable=False)
    reward: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    capital_before: Mapped[float] = mapped_column(Float, nullable=False)
    capital_after: Mapped[float] = mapped_column(Float, nullable=False)
    played_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    room: Mapped["ArenaRoom"] = relationship("ArenaRoom", back_populates="round_plays")
    player: Mapped["ArenaPlayer"] = relationship("ArenaPlayer", back_populates="plays")
