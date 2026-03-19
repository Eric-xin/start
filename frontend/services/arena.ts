import { api } from "./api";
import { getItem } from "./storage";
import type { CardData } from "./portfolio";

export interface ArenaPlayerData {
  id: string;
  user_id: string;
  username: string;
  capital: number;
  status: string;
  is_host: boolean;
}

export interface ArenaRoomData {
  id: string;
  code: string;
  host_user_id: string;
  status: "waiting" | "playing" | "finished";
  round_count: number;
  current_round: number;
  starting_capital: number;
  max_players: number;
  players: ArenaPlayerData[];
}

export interface RoundResult {
  player_id: string;
  username: string;
  capital_before: number;
  capital_after: number;
  capital_delta: number;
  action: string;
  reward: number;
  rank: number;
}

export interface FinalStanding {
  rank: number;
  player_id: string;
  user_id: string;
  username: string;
  capital: number;
  capital_delta: number;
}

// ─── REST ───────────────────────────────────────────────────────────────────

export async function createRoom(
  roundCount: number,
  startingCapital: number,
  maxPlayers: number
): Promise<ArenaRoomData> {
  const resp = await api.post<ArenaRoomData>("/api/arena/rooms", {
    round_count: roundCount,
    starting_capital: startingCapital,
    max_players: maxPlayers,
  });
  return resp.data;
}

export async function getRoom(code: string): Promise<ArenaRoomData> {
  const resp = await api.get<ArenaRoomData>(`/api/arena/rooms/${code}`);
  return resp.data;
}

export async function joinRoom(code: string): Promise<ArenaRoomData> {
  const resp = await api.post<ArenaRoomData>(`/api/arena/rooms/${code}/join`);
  return resp.data;
}

export async function startGame(code: string): Promise<ArenaRoomData> {
  const resp = await api.post<ArenaRoomData>(`/api/arena/rooms/${code}/start`);
  return resp.data;
}

export async function playArenaCard(
  code: string,
  action: "left" | "right"
): Promise<any> {
  const resp = await api.post(`/api/arena/rooms/${code}/play`, { action });
  return resp.data;
}

// ─── WebSocket ───────────────────────────────────────────────────────────────

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_BASE = API_BASE.replace(/^http/, "ws");

export type WsMessage =
  | { type: "room_state"; room: Omit<ArenaRoomData, "players">; players: ArenaPlayerData[] }
  | { type: "round_start"; round_number: number; total_rounds: number; card: CardData }
  | { type: "player_played"; player_id: string; username: string; round_number: number; played_count: number; total_count: number }
  | { type: "round_complete"; round_number: number; results: RoundResult[]; is_final: boolean }
  | { type: "game_over"; standings: FinalStanding[] }
  | { type: "player_joined"; player_id: string; username: string }
  | { type: "player_connected"; player_id: string; username: string }
  | { type: "player_disconnected"; player_id: string; username: string };

export function createArenaWebSocket(
  code: string,
  token: string,
  onMessage: (msg: WsMessage) => void,
  onClose: () => void
): WebSocket {
  const url = `${WS_BASE}/api/arena/ws/${code}?token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(url);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as WsMessage;
      onMessage(msg);
    } catch {
      // ignore parse errors
    }
  };

  ws.onclose = onClose;
  ws.onerror = () => onClose();

  return ws;
}
