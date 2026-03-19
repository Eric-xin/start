import { api } from "./api";

export interface StrategyInfo {
  key: string;
  label: string;
  stage: number;
  unlock_at: number;
  is_unlocked: boolean;
  is_enabled: boolean;
}

export interface ProgressData {
  unlocked_strategies: string[];
  enabled_strategies: string[];
  total_cards_played: number;
  strategies: StrategyInfo[];
}

export async function getProgress(): Promise<ProgressData> {
  const resp = await api.get<ProgressData>("/api/progress");
  return resp.data;
}

export async function updateProgress(
  enabled_strategies: string[]
): Promise<ProgressData> {
  const resp = await api.patch<ProgressData>("/api/progress", { enabled_strategies });
  return resp.data;
}
