import { create } from "zustand";
import type { CardData, SessionData } from "../services/game";
// SessionData no longer includes persona_vector — it now has persona_id

interface LessonState {
  text: string;
  direction: "left" | "right";
  reward: number;
}

interface GameState {
  session: SessionData | null;
  currentCard: CardData | null;
  nextCard: CardData | null;
  lesson: LessonState | null;
  isSwipeLocked: boolean;
  setSession: (session: SessionData) => void;
  setCurrentCard: (card: CardData | null) => void;
  setNextCard: (card: CardData | null) => void;
  setLesson: (lesson: LessonState | null) => void;
  setSwipeLocked: (locked: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  session: null,
  currentCard: null,
  nextCard: null,
  lesson: null,
  isSwipeLocked: false,

  setSession: (session) => set({ session }),
  setCurrentCard: (card) => set({ currentCard: card }),
  setNextCard: (card) => set({ nextCard: card }),
  setLesson: (lesson) => set({ lesson }),
  setSwipeLocked: (locked) => set({ isSwipeLocked: locked }),
  reset: () => set({ session: null, currentCard: null, nextCard: null, lesson: null, isSwipeLocked: false }),
}));
