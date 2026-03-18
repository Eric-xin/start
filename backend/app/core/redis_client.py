from redis.asyncio import Redis, from_url
from app.config import get_settings

settings = get_settings()

_redis: Redis | None = None


async def get_redis_client() -> Redis:
    global _redis
    if _redis is None:
        _redis = await from_url(settings.redis_url, decode_responses=True)
    return _redis


async def get_redis() -> Redis:
    return await get_redis_client()
