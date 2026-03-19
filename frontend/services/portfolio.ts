import { api } from "./api";
import type { AchievementData } from "./achievements";

export interface PortfolioData {
  id: string;
  capital: number;
  net_worth: number;
  peak_net_worth: number;
  total_income_received: number;
  stage: number;
  investor_rank: number;
  total_cards_played: number;
  topic_mastery: Record<string, number>;
  portfolio_weights: Record<string, number>;
  market_state: Record<string, number>;
  last_income_date: string | null;
  income_streak: number;
  persona_id: string | null;
  companion_id: string | null;
  can_claim_income: boolean;
  pending_income: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateCompanionResult {
  companion_id: string | null;
}

export interface CardData {
  id: string;
  type: string;
  title: string;
  body: string;
  emoji: string;
  stage_min: number;
  stage_max: number;
  topics: string[];
  difficulty: number;
  diagnostic_power: number;
  card_band_color: string;
  left_choice: string;
  right_choice: string;
  left_lesson: string;
  right_lesson: string;
}

export interface PlayResult {
  lesson: string;
  reward: number;
  is_correct: boolean;
  capital_before: number;
  capital_after: number;
  net_worth: number;
  next_card: CardData | null;
  portfolio: PortfolioData;
  newly_unlocked_achievements: AchievementData[];
}

export interface ClaimIncomeResult {
  amount: number;
  new_capital: number;
  new_net_worth: number;
  streak: number;
  message: string;
  newly_unlocked_achievements: AchievementData[];
}

export interface NetWorthPoint {
  id: string;
  net_worth: number;
  capital: number;
  snapshot_date: string;
  created_at: string;
}

export interface CardPlayData {
  id: string;
  action: string;
  reward: number;
  capital_before: number;
  capital_after: number;
  created_at: string;
  card: CardData | null;
}

export async function getPortfolio(): Promise<PortfolioData> {
  const resp = await api.get<PortfolioData>("/api/portfolio");
  return resp.data;
}

export async function claimDailyIncome(): Promise<ClaimIncomeResult> {
  const resp = await api.post<ClaimIncomeResult>("/api/portfolio/claim-income");
  return resp.data;
}

export async function playCard(cardId: string, action: "left" | "right"): Promise<PlayResult> {
  const resp = await api.post<PlayResult>("/api/portfolio/play", { card_id: cardId, action });
  return resp.data;
}

export async function getNextCard(): Promise<CardData> {
  const resp = await api.get<CardData>("/api/portfolio/next-card");
  return resp.data;
}

export async function getNetWorthHistory(): Promise<NetWorthPoint[]> {
  const resp = await api.get<NetWorthPoint[]>("/api/portfolio/history");
  return resp.data;
}

export async function getRecentPlays(limit = 20): Promise<CardPlayData[]> {
  const resp = await api.get<CardPlayData[]>("/api/portfolio/recent-plays", { params: { limit } });
  return resp.data;
}

export async function updateCompanion(companionId: string): Promise<PortfolioData> {
  const resp = await api.patch<PortfolioData>("/api/portfolio/companion", { companion_id: companionId });
  return resp.data;
}
