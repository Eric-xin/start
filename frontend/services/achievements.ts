import { api } from "./api";

export interface AchievementData {
  id: string;
  key: string;
  category: string;
  title: string;
  description: string;
  emoji: string;
  tier: string;
  condition_type: string;
  condition_value: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export async function getAchievements(): Promise<AchievementData[]> {
  const resp = await api.get<AchievementData[]>("/api/achievements");
  return resp.data;
}
