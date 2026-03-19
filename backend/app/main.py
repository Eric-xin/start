from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, users, cards, admin, game, progress
from app.routers import personas as personas_router

# Import models so Base.metadata knows about all tables
import app.models.user       # noqa: F401
import app.models.card       # noqa: F401
import app.models.game       # noqa: F401
import app.models.persona    # noqa: F401
import app.models.progress   # noqa: F401

settings = get_settings()


async def _ensure_sqlite_card_columns() -> None:
    """Dev helper: keep local SQLite cards schema in sync for added columns."""
    if not settings.database_url.startswith("sqlite"):
        return

    async with engine.begin() as conn:
        try:
            rows = await conn.execute(text("PRAGMA table_info(cards)"))
            existing = {row[1] for row in rows.fetchall()}

            if "value_min" not in existing:
                await conn.execute(text("ALTER TABLE cards ADD COLUMN value_min FLOAT"))
            if "value_max" not in existing:
                await conn.execute(text("ALTER TABLE cards ADD COLUMN value_max FLOAT"))
            if "value_step" not in existing:
                await conn.execute(text("ALTER TABLE cards ADD COLUMN value_step FLOAT"))
            if "alpha" not in existing:
                await conn.execute(text("ALTER TABLE cards ADD COLUMN alpha FLOAT DEFAULT 1.0 NOT NULL"))
        except Exception:
            # Non-fatal in dev: startup should continue even if schema patch fails.
            pass


async def _ensure_sqlite_daily_streak_columns() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    async with engine.begin() as conn:
        try:
            game_rows = await conn.execute(text("PRAGMA table_info(game_sessions)"))
            game_existing = {row[1] for row in game_rows.fetchall()}

            if "is_daily" not in game_existing:
                await conn.execute(text("ALTER TABLE game_sessions ADD COLUMN is_daily BOOLEAN DEFAULT 0 NOT NULL"))
            if "daily_date" not in game_existing:
                await conn.execute(text("ALTER TABLE game_sessions ADD COLUMN daily_date DATE"))
            if "daily_cards_played" not in game_existing:
                await conn.execute(text("ALTER TABLE game_sessions ADD COLUMN daily_cards_played INTEGER DEFAULT 0 NOT NULL"))
            if "daily_target" not in game_existing:
                await conn.execute(text("ALTER TABLE game_sessions ADD COLUMN daily_target INTEGER DEFAULT 10 NOT NULL"))
            if "daily_completed" not in game_existing:
                await conn.execute(text("ALTER TABLE game_sessions ADD COLUMN daily_completed BOOLEAN DEFAULT 0 NOT NULL"))
            if "streak_bonus_awarded" not in game_existing:
                await conn.execute(text("ALTER TABLE game_sessions ADD COLUMN streak_bonus_awarded FLOAT DEFAULT 0.0 NOT NULL"))

            progress_rows = await conn.execute(text("PRAGMA table_info(user_progress)"))
            progress_existing = {row[1] for row in progress_rows.fetchall()}

            if "streak_count" not in progress_existing:
                await conn.execute(text("ALTER TABLE user_progress ADD COLUMN streak_count INTEGER DEFAULT 0 NOT NULL"))
            if "last_streak_date" not in progress_existing:
                await conn.execute(text("ALTER TABLE user_progress ADD COLUMN last_streak_date DATE"))
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables (new tables only — won't modify existing)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Safely add new columns to existing tables (idempotent; runs in all environments)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name='game_sessions' AND column_name='persona_id'
                    ) THEN
                        ALTER TABLE game_sessions
                            ADD COLUMN persona_id UUID REFERENCES personas(id) ON DELETE SET NULL;
                    END IF;
                    BEGIN
                        ALTER TABLE game_sessions ALTER COLUMN persona_vector DROP NOT NULL;
                    EXCEPTION WHEN OTHERS THEN NULL;
                    END;
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name='user_progress' AND column_name='unlocked_decks'
                    ) THEN
                        ALTER TABLE user_progress ADD COLUMN unlocked_decks JSONB;
                        ALTER TABLE user_progress ADD COLUMN enabled_decks JSONB;
                    END IF;
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name='user_progress' AND column_name='streak_count'
                    ) THEN
                        ALTER TABLE user_progress ADD COLUMN streak_count INTEGER DEFAULT 0 NOT NULL;
                        ALTER TABLE user_progress ADD COLUMN last_streak_date DATE;
                    END IF;
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name='game_sessions' AND column_name='is_daily'
                    ) THEN
                        ALTER TABLE game_sessions ADD COLUMN is_daily BOOLEAN DEFAULT FALSE NOT NULL;
                        ALTER TABLE game_sessions ADD COLUMN daily_date DATE;
                        ALTER TABLE game_sessions ADD COLUMN daily_cards_played INTEGER DEFAULT 0 NOT NULL;
                        ALTER TABLE game_sessions ADD COLUMN daily_target INTEGER DEFAULT 10 NOT NULL;
                        ALTER TABLE game_sessions ADD COLUMN daily_completed BOOLEAN DEFAULT FALSE NOT NULL;
                        ALTER TABLE game_sessions ADD COLUMN streak_bonus_awarded DOUBLE PRECISION DEFAULT 0.0 NOT NULL;
                    END IF;
                END $$;
            """))
        except Exception:
            pass  # ignore if not postgres or already applied

    await _ensure_sqlite_card_columns()
    await _ensure_sqlite_daily_streak_columns()

    # Seed data in development
    if settings.environment == "development":
        from app.seeds.run_seeds import run_seeds
        try:
            await run_seeds()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Seed failed (may be normal): {e}")

    yield

    await engine.dispose()


app = FastAPI(
    title="CardEcon API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:8081", "http://localhost:19006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(cards.router)
app.include_router(admin.router)
app.include_router(game.router)
app.include_router(personas_router.router)
app.include_router(progress.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
