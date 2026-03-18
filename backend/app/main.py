from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, users, cards, admin, game, persona

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables (alembic handles prod migrations, this helps dev)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

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
app.include_router(persona.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
