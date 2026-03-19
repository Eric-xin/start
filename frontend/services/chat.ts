import { api } from "./api";

export interface ChatCardContext {
  title?: string;
  body?: string;
  topics?: string[];
}

export interface ChatExplainRequest {
  question: string;
  stage?: number;
  context?: ChatCardContext;
}

export interface ChatExplainResponse {
  answer: string;
  source: "glossary" | "llm" | "fallback" | string;
  term_matched?: string | null;
  suggestions: string[];
  disclaimer: string;
}

export async function explainTerm(payload: ChatExplainRequest): Promise<ChatExplainResponse> {
  const resp = await api.post<ChatExplainResponse>("/api/chat/explain", payload);
  return resp.data;
}
