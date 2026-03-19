from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.chat import ChatExplainRequest, ChatExplainResponse
from app.services.chat_service import explain_term, allow_request, ChatServiceError


router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/explain", response_model=ChatExplainResponse)
async def explain_financial_term(
    payload: ChatExplainRequest,
    user: User = Depends(get_current_active_user),
):
    if not allow_request(str(user.id)):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many chat requests. Please wait a minute and try again.",
        )

    topics = payload.context.topics if payload.context else []
    try:
        result = await explain_term(payload.question, stage=payload.stage, topics=topics)
    except ChatServiceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return ChatExplainResponse(**result)
