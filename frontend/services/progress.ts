import { api } from "./api";

export interface StrategyInfo {
  key: string;
  label: string;
  stage: number;
  unlock_at: number;
  is_unlocked: boolean;
  is_enabled: boolean;
}

export interface DeckInfo {
  key: string;
  label: string;
  strategy: string;
  description: string;
  unlock_at: number;
  is_unlocked: boolean;
  is_enabled: boolean;
  is_purchasable?: boolean;
  shop_price?: number | null;
  card_style?: string | null;
}

export interface ProgressData {
  unlocked_strategies: string[];
  enabled_strategies: string[];
  unlocked_decks: string[];
  enabled_decks: string[];
  total_cards_played: number;
  strategies: StrategyInfo[];
  decks: DeckInfo[];
}

export async function getProgress(): Promise<ProgressData> {
  const resp = await api.get<ProgressData>("/api/progress");
  return resp.data;
}

export async function updateProgress(data: {
  enabled_strategies?: string[];
  enabled_decks?: string[];
}): Promise<ProgressData> {
  const resp = await api.patch<ProgressData>("/api/progress", data);
  return resp.data;
}

export interface PurchaseDeckResponse {
  progress: ProgressData;
  remaining_capital: number;
  remaining_net_worth: number;
  purchased_deck_key: string;
}

export async function purchaseDeck(deckKey: string): Promise<PurchaseDeckResponse> {
  const resp = await api.post<PurchaseDeckResponse>("/api/progress/purchase-deck", { deck_key: deckKey });
  return resp.data;
}
