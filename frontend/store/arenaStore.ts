import { create } from "zustand";
import type { ArenaRoomData, ArenaPlayerData, RoundResult, FinalStanding, WsMessage } from "../services/arena";
import type { CardData } from "../services/portfolio";
import { createArenaWebSocket } from "../services/arena";
import { getItem } from "../services/storage";

interface ArenaState {
  // Room info
  room: Omit<ArenaRoomData, "players"> | null;
  players: ArenaPlayerData[];
  myPlayerId: string | null;

  // Game state
  currentCard: CardData | null;
  currentRound: number;
  totalRounds: number;

  // Per-round tracking
  waitingFor: { played_count: number; total_count: number } | null;
  roundResults: RoundResult[] | null;

  // Final
  finalStandings: FinalStanding[] | null;

  // WS
  ws: WebSocket | null;
  wsConnected: boolean;

  // Actions
  setRoom: (room: Omit<ArenaRoomData, "players">, players: ArenaPlayerData[]) => void;
  setMyPlayerId: (id: string) => void;
  connectWs: (code: string) => Promise<void>;
  disconnectWs: () => void;
  setWaitingFor: (data: { played_count: number; total_count: number } | null) => void;
  clearRoundResults: () => void;
  reset: () => void;
}

export const useArenaStore = create<ArenaState>((set, get) => ({
  room: null,
  players: [],
  myPlayerId: null,
  currentCard: null,
  currentRound: 0,
  totalRounds: 0,
  waitingFor: null,
  roundResults: null,
  finalStandings: null,
  ws: null,
  wsConnected: false,

  setRoom: (room, players) => set({ room, players }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setWaitingFor: (data) => set({ waitingFor: data }),
  clearRoundResults: () => set({ roundResults: null }),

  connectWs: async (code: string) => {
    const existing = get().ws;
    if (existing) {
      existing.close();
    }

    const token = await getItem("access_token");
    if (!token) return;

    const ws = createArenaWebSocket(
      code,
      token,
      (msg: WsMessage) => {
        switch (msg.type) {
          case "room_state":
            set({
              room: msg.room,
              players: msg.players,
              currentRound: msg.room.current_round,
              totalRounds: msg.room.round_count,
            });
            break;

          case "round_start":
            set({
              currentCard: msg.card,
              currentRound: msg.round_number,
              totalRounds: msg.total_rounds,
              roundResults: null,
              waitingFor: null,
            });
            break;

          case "player_played":
            set({
              waitingFor: {
                played_count: msg.played_count,
                total_count: msg.total_count,
              },
            });
            break;

          case "round_complete":
            set({
              roundResults: msg.results,
              currentCard: null,
              waitingFor: null,
              // Update player capitals from results
              players: get().players.map((p) => {
                const result = msg.results.find((r) => r.player_id === p.id);
                return result ? { ...p, capital: result.capital_after } : p;
              }),
            });
            break;

          case "game_over":
            set({
              finalStandings: msg.standings,
              roundResults: null,
              currentCard: null,
            });
            break;

          case "player_connected":
          case "player_joined":
            // Room state update will follow
            break;

          case "player_disconnected":
            set({
              players: get().players.map((p) =>
                p.id === msg.player_id ? { ...p, status: "disconnected" } : p
              ),
            });
            break;
        }
      },
      () => {
        set({ wsConnected: false });
      }
    );

    ws.onopen = () => set({ wsConnected: true });
    set({ ws });
  },

  disconnectWs: () => {
    const ws = get().ws;
    if (ws) ws.close();
    set({ ws: null, wsConnected: false });
  },

  reset: () => {
    const ws = get().ws;
    if (ws) ws.close();
    set({
      room: null,
      players: [],
      myPlayerId: null,
      currentCard: null,
      currentRound: 0,
      totalRounds: 0,
      waitingFor: null,
      roundResults: null,
      finalStandings: null,
      ws: null,
      wsConnected: false,
    });
  },
}));
