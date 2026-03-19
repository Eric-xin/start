import { api } from "./api";

export interface AssetInfo {
  id: string;
  ticker: string;
  name: string;
  asset_class: string;
  description: string;
  data_available: boolean;
}

export interface PortfolioPoint {
  date: string;
  value: number;
  allocation: Record<string, number>;
}

export interface TradeRecord {
  date: string;
  asset: string;
  action: string;
  old_weight: number;
  new_weight: number;
  reason: string;
  trigger_trait: string;
  trait_value: number;
}

export interface EventAnnotation {
  date: string;
  label: string;
  impact: string;
}

export interface SimulationMetrics {
  total_return: number;
  annualized_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  volatility: number;
  best_month: number;
  worst_month: number;
  total_trades: number;
}

export interface SimulationResponse {
  portfolio_history: PortfolioPoint[];
  benchmark_history: PortfolioPoint[];
  trades: TradeRecord[];
  events: EventAnnotation[];
  metrics: SimulationMetrics;
  final_allocation: Record<string, number>;
  traits: Record<string, number>;
  persona_type: string;
}

export interface SimulationRequest {
  persona_vector?: number[];
  start_date?: string;
  end_date?: string;
  initial_capital?: number;
  asset_classes?: string[];
}

export async function getSimulationAssets(): Promise<AssetInfo[]> {
  const res = await api.get<AssetInfo[]>("/api/simulation/assets");
  return res.data;
}

export async function runSimulation(req: SimulationRequest): Promise<SimulationResponse> {
  const res = await api.post<SimulationResponse>("/api/simulation/run", req);
  return res.data;
}

export async function getMarketEvents(start?: string, end?: string): Promise<EventAnnotation[]> {
  const params: Record<string, string> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  const res = await api.get<EventAnnotation[]>("/api/simulation/events", { params });
  return res.data;
}
