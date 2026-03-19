from pydantic import BaseModel, Field


class ChatCardContext(BaseModel):
    title: str | None = None
    body: str | None = None
    topics: list[str] = Field(default_factory=list)


class ChatExplainRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    stage: int | None = Field(default=None, ge=1, le=5)
    context: ChatCardContext | None = None


class ChatExplainResponse(BaseModel):
    answer: str
    source: str
    term_matched: str | None = None
    suggestions: list[str] = Field(default_factory=list)
    disclaimer: str = "Educational only, not financial advice."
