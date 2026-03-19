import { api } from "./api";
import type { CardData, PortfolioData } from "./portfolio";
import type { CompanionId, CompanionMarketState } from "../constants/companions";

export interface Article {
  title: string;
  url: string;
}

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompanionChatContext {
  current_card: Pick<CardData, "title" | "body" | "topics"> | null;
  market_state: CompanionMarketState;
  news_items: { headline: string; category: string }[];
  portfolio: Pick<PortfolioData, "capital" | "stage" | "investor_rank"> | null;
}

export interface CompanionChatResponse {
  reply: string;
  articles: Article[];
}

export async function askCompanion(
  companionId: CompanionId,
  message: string,
  context: CompanionChatContext
): Promise<CompanionChatResponse> {
  const resp = await api.post<CompanionChatResponse>("/api/companion/chat", {
    companion_id: companionId,
    message,
    context,
  });
  return resp.data;
}
