import { api } from "./api";

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  net_worth: number;
  investor_rank: number;
  total_cards_played: number;
  portfolio_id: string;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  current_user_rank: number | null;
}

const RANK_LABELS = ["", "ANALYST", "ASSOCIATE", "VP", "MD"];

export async function getLeaderboard(limit: number = 50): Promise<LeaderboardData> {
  const response = await api.get<LeaderboardData>("/api/leaderboard", {
    params: { limit },
  });
  return response.data;
}

export function getRankLabel(rank: number): string {
  return RANK_LABELS[Math.min(rank, RANK_LABELS.length - 1)] || "MD";
}
