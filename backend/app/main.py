from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, users, cards, admin, game, progress
from app.routers import personas as personas_router
from app.routers import portfolio as portfolio_router
from app.routers import achievements as achievements_router
from app.routers import simulation as simulation_router
from app.routers import game_hud as game_hud_router
from app.routers import companion_chat as companion_chat_router

# Import models so Base.metadata knows about all tables
import app.models.user  # noqa: F401
import app.models.card  # noqa: F401
import app.models.game  # noqa: F401
import app.models.persona  # noqa: F401
import app.models.progress  # noqa: F401
import app.models.portfolio  # noqa: F401
import app.models.achievement  # noqa: F401
import app.models.market  # noqa: F401

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
                await conn.execute(
                    text("ALTER TABLE cards ADD COLUMN value_step FLOAT")
                )
            if "alpha" not in existing:
                await conn.execute(
                    text(
                        "ALTER TABLE cards ADD COLUMN alpha FLOAT DEFAULT 1.0 NOT NULL"
                    )
                )
            if "weights" not in existing:
                await conn.execute(
                    text("ALTER TABLE cards ADD COLUMN weights JSON DEFAULT '{}'")
                )
        except Exception:
            # Non-fatal in dev: startup should continue even if schema patch fails.
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables (new tables only — won't modify existing)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Dev-only: safely add new columns to existing tables
    if settings.environment == "development":
        async with engine.begin() as conn:
            try:
                await conn.execute(
                    text(
                        """
                    DO $$
                    BEGIN
                        -- Migrate cards.id from INTEGER to UUID
                        -- (drop dependents first, then cards; create_all will recreate them)
                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name='cards' AND column_name='id'
                            AND data_type='integer'
                        ) THEN
                            DROP TABLE IF EXISTS card_plays CASCADE;
                            DROP TABLE IF EXISTS game_events CASCADE;
                            DROP TABLE IF EXISTS cards CASCADE;
                        END IF;

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
                            WHERE table_name='cards' AND column_name='weights'
                        ) THEN
                            ALTER TABLE cards ADD COLUMN weights JSONB NOT NULL DEFAULT '{}';
                        END IF;
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name='user_portfolios' AND column_name='market_state'
                        ) THEN
                            ALTER TABLE user_portfolios ADD COLUMN market_state JSONB NOT NULL DEFAULT '{}';
                        END IF;
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name='user_portfolios' AND column_name='companion_id'
                        ) THEN
                            ALTER TABLE user_portfolios ADD COLUMN companion_id VARCHAR(32);
                        END IF;
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint
                            WHERE conname = 'uq_user_achievement'
                        ) THEN
                            ALTER TABLE user_achievements
                                ADD CONSTRAINT uq_user_achievement
                                UNIQUE (user_id, achievement_id);
                        END IF;
                    END $$;
                """
                    )
                )
            except Exception:
                pass  # ignore if not postgres or already applied

        # Re-run create_all after potential table drops
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        await _ensure_sqlite_card_columns()
        async with engine.begin() as conn:
            try:
                await conn.execute(text("ALTER TABLE user_portfolios ADD COLUMN companion_id VARCHAR(32)"))
            except Exception:
                pass

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
    allow_origins=[
        settings.frontend_url,
        "http://localhost:8081",
        "http://localhost:19006",
    ],
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
app.include_router(portfolio_router.router)
app.include_router(achievements_router.router)
app.include_router(simulation_router.router)
app.include_router(game_hud_router.router)
app.include_router(companion_chat_router.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
