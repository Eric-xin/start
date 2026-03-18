import { create } from "zustand";
import type { CardData, SessionData } from "../services/game";

interface GameState {
  session: SessionData | null;
  currentCard: CardData | null;
  nextCard: CardData | null;
  lessonText: string | null;
  lessonColor: string;
  isSwipeLocked: boolean;
  setSession: (session: SessionData) => void;
  setCurrentCard: (card: CardData | null) => void;
  setNextCard: (card: CardData | null) => void;
  setLessonText: (text: string | null, color?: string) => void;
  setSwipeLocked: (locked: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  session: null,
  currentCard: null,
  nextCard: null,
  lessonText: null,
  lessonColor: "#00ff88",
  isSwipeLocked: false,

  setSession: (session) => set({ session }),
  setCurrentCard: (card) => set({ currentCard: card }),
  setNextCard: (card) => set({ nextCard: card }),
  setLessonText: (text, color = "#00ff88") => set({ lessonText: text, lessonColor: color }),
  setSwipeLocked: (locked) => set({ isSwipeLocked: locked }),
  reset: () =>
    set({
      session: null,
      currentCard: null,
      nextCard: null,
      lessonText: null,
      isSwipeLocked: false,
    }),
}));
