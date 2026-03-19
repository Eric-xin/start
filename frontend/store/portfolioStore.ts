import { create } from "zustand";
import type { PortfolioData, CardData } from "../services/portfolio";

interface LessonState {
  text: string;
  direction: "left" | "right";
  reward: number;
}

interface PortfolioState {
  portfolio: PortfolioData | null;
  currentCard: CardData | null;
  nextCard: CardData | null;
  lesson: LessonState | null;
  isSwipeLocked: boolean;
  setPortfolio: (p: PortfolioData) => void;
  setCurrentCard: (c: CardData | null) => void;
  setNextCard: (c: CardData | null) => void;
  setLesson: (l: LessonState | null) => void;
  setSwipeLocked: (v: boolean) => void;
  reset: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolio: null,
  currentCard: null,
  nextCard: null,
  lesson: null,
  isSwipeLocked: false,

  setPortfolio: (portfolio) => set({ portfolio }),
  setCurrentCard: (card) => set({ currentCard: card }),
  setNextCard: (card) => set({ nextCard: card }),
  setLesson: (lesson) => set({ lesson }),
  setSwipeLocked: (locked) => set({ isSwipeLocked: locked }),
  reset: () => set({ portfolio: null, currentCard: null, nextCard: null, lesson: null, isSwipeLocked: false }),
}));
