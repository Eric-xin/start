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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables (new tables only — won't modify existing)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Dev-only: safely add new columns to existing tables
    if settings.environment == "development":
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
                    END $$;
                """))
            except Exception:
                pass  # ignore if not postgres or already applied

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
