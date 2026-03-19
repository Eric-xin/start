from __future__ import annotations

import asyncio
from typing import Any

from googleapiclient.discovery import build
from openai import AsyncOpenAI

from app.config import get_settings

settings = get_settings()

COMPANION_SYSTEM_PROMPTS = {
    "bull": "You are BULL, an over-the-top optimistic investor bro. Use hype slang, emojis, short punchy sentences. Always bullish. Never boring.",
    "penny": "You are Penny, a cautious fox who loves to save. Use gentle, thoughtful language. Ask clarifying questions when helpful. Never rush.",
    "luna": "You are Luna, a calm and wise guide. Use poetic but clear language. Focus on patience and long-term thinking.",
    "dash": "You are Dash, a hyperactive robot obsessed with data. Use numbers, percentages, and tech jargon but explain them. Fast sentences.",
    "bear": "You are BEAR, the eternal skeptic. Everything is overvalued. Use dry humor and deadpan delivery. Always find the risk.",
    "sage": "You are Sage, a wise owl professor. Use clear explanations with analogies. Always teach why, not just what.",
}


def build_context_block(context: dict[str, Any] | None) -> str:
    if not context:
        return "No additional game context provided."

    current_card = context.get("current_card") or {}
    market_state = context.get("market_state") or {}
    news_items = context.get("news_items") or []
    portfolio = context.get("portfolio") or {}

    lines = [
        "You are answering as an in-game companion for CardEcon.",
        "Use the user's current gameplay context when relevant.",
        f"Current card title: {current_card.get('title', 'N/A')}",
        f"Current card body: {current_card.get('body', 'N/A')}",
        f"Current card topics: {', '.join(current_card.get('topics', []) or []) or 'N/A'}",
        f"Market state: {market_state}",
        f"Portfolio state: capital={portfolio.get('capital', 'N/A')}, stage={portfolio.get('stage', 'N/A')}, investor_rank={portfolio.get('investor_rank', 'N/A')}",
    ]
    if news_items:
        lines.append("Recent news headlines:")
        for item in news_items[:5]:
          lines.append(f"- {item.get('headline', 'Untitled')} [{item.get('category', 'general')}]")
    else:
        lines.append("Recent news headlines: none provided.")
    lines.append("Keep replies under 220 words, answer clearly, and mention uncertainty when appropriate.")
    return "\n".join(lines)


async def search_articles(query: str, max_results: int = 3) -> list[dict[str, str]]:
    if not settings.google_api_key or not settings.google_cse_id:
        return []

    def _search() -> list[dict[str, str]]:
        service = build("customsearch", "v1", developerKey=settings.google_api_key)
        result = (
            service.cse()
            .list(q=query, cx=settings.google_cse_id, num=max_results)
            .execute()
        )
        return [
            {"title": item.get("title", "Untitled"), "url": item.get("link", "")}
            for item in result.get("items", [])
            if item.get("link")
        ]

    try:
        return await asyncio.to_thread(_search)
    except Exception:
        return []


async def companion_chat(companion_id: str, user_message: str, context: dict[str, Any] | None) -> dict[str, Any]:
    if companion_id not in COMPANION_SYSTEM_PROMPTS:
        raise ValueError("Unknown companion.")

    if not settings.openai_api_key:
        raise RuntimeError("OpenAI API key not configured.")

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": COMPANION_SYSTEM_PROMPTS[companion_id] + "\n\n" + build_context_block(context),
            },
            {"role": "user", "content": user_message},
        ],
        max_tokens=300,
        temperature=0.8,
    )

    reply = response.choices[0].message.content or "I don't have a useful answer yet."
    articles = await search_articles(user_message, max_results=3)
    return {"reply": reply, "articles": articles}
