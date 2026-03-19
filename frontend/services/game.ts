import { api } from "./api";

export interface CardData {
  id: number;
  type: "education" | "event" | "action";
  title: string;
  body: string;
  emoji: string;
  stage_min: number;
  stage_max: number;
  topics: string[];
  linked_traits: string[];
  difficulty: number;
  diagnostic_power: number;
  left_choice: string;
  right_choice: string;
  left_lesson: string;
  right_lesson: string;
  card_band_color: string;
}

export interface GameEventData {
  id: number;
  card_id: number | null;
  action: "left" | "right";
  reward: number;
  card: CardData | null;
  created_at: string;
}

export interface SessionData {
  id: string;
  user_id: string;
  persona_id: string | null;
  stage: number;
  progress: number;
  topic_mastery: Record<string, number>;
  investor_rank: number;
  capital: number;
  portfolio_weights: Record<string, number>;
  peak_capital: number;
  created_at: string;
  updated_at: string;
}

export interface SwipeResponse {
  lesson: string;
  reward: number;
  session: SessionData;
  next_card: CardData | null;
}

export async function getSessions(): Promise<SessionData[]> {
  const resp = await api.get<SessionData[]>("/api/game/sessions");
  return resp.data;
}

export async function createSession(): Promise<SessionData> {
  const resp = await api.post<SessionData>("/api/game/sessions");
  return resp.data;
}

export async function getSession(sessionId: string): Promise<SessionData> {
  const resp = await api.get<SessionData>(`/api/game/sessions/${sessionId}`);
  return resp.data;
}

export async function swipe(
  sessionId: string,
  cardId: number,
  action: "left" | "right"
): Promise<SwipeResponse> {
  const resp = await api.post<SwipeResponse>(
    `/api/game/sessions/${sessionId}/swipe`,
    { card_id: cardId, action }
  );
  return resp.data;
}

export async function getNextCard(sessionId: string): Promise<CardData | null> {
  const resp = await api.get<CardData | null>(`/api/game/sessions/${sessionId}/next-card`);
  return resp.data;
}

export async function getSessionHistory(sessionId: string): Promise<GameEventData[]> {
  const resp = await api.get<GameEventData[]>(`/api/game/sessions/${sessionId}/history`);
  return resp.data;
}
