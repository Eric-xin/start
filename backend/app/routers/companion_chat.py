from __future__ import annotations

from collections import defaultdict, deque
from time import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.companion_llm import companion_chat

router = APIRouter(prefix="/api/companion", tags=["companion"])

_RATE_WINDOW_SECONDS = 60
_RATE_LIMIT = 10
_request_log: dict[str, deque[float]] = defaultdict(deque)


def _check_rate_limit(user_id: str) -> None:
    now = time()
    user_queue = _request_log[user_id]
    while user_queue and now - user_queue[0] > _RATE_WINDOW_SECONDS:
        user_queue.popleft()
    if len(user_queue) >= _RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many companion chat requests. Please slow down.")
    user_queue.append(now)


@router.post("/chat")
async def chat_with_companion(
    body: dict[str, Any],
    current_user: User = Depends(get_current_active_user),
):
    companion_id = body.get("companion_id")
    message = (body.get("message") or "").strip()
    context = body.get("context") or {}

    if not companion_id:
        raise HTTPException(status_code=422, detail="companion_id is required.")
    if not message:
        raise HTTPException(status_code=422, detail="message is required.")

    _check_rate_limit(str(current_user.id))

    try:
        return await companion_chat(companion_id, message, context)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=502, detail="Companion chat service unavailable.")
