import { api } from "./api";

export interface MarketAssetData {
  ticker: string;
  name: string;
  asset_class: string;
  latest_price: number;
  return_7d: number;
  return_30d: number;
  trend: "up" | "down" | "flat";
  sparkline: number[];
}

export interface MarketOverview {
  assets: MarketAssetData[];
  as_of: string | null;
}

export interface NewsItem {
  id: string;
  headline: string;
  body: string;
  category: string;
  sentiment: "bullish" | "bearish" | "mixed";
  urgency: "high" | "medium" | "low";
  timestamp: string;
}

export interface NewsFeed {
  items: NewsItem[];
}

export interface AssetDetail extends MarketAssetData {
  return_90d: number;
  prices_90d: number[];
  factors: Record<string, number>;      // e.g. { Sentiment: 34.2, Inflation: -18.1, ... }
  interpretation: string;
  volatility_regime: "HIGH" | "ELEVATED" | "LOW";
  annual_drift_pct: number;
  annual_vol_pct: number;
}

export async function getMarketOverview(): Promise<MarketOverview> {
  const resp = await api.get<MarketOverview>("/api/hud/market");
  return resp.data;
}

export async function getAssetDetail(ticker: string): Promise<AssetDetail> {
  const resp = await api.get<AssetDetail>(`/api/hud/market/${ticker}`);
  return resp.data;
}

export async function getNewsFeed(): Promise<NewsFeed> {
  const resp = await api.get<NewsFeed>("/api/hud/news");
  return resp.data;
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
