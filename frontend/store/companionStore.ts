import { create } from "zustand";
import type { Article, LLMMessage } from "../services/companionChat";
import type { CompanionId } from "../constants/companions";

interface CompanionState {
  companionId: CompanionId | null;
  bubbleText: string | null;
  bubbleVisible: boolean;
  recentPhrases: string[];
  llmMode: boolean;
  llmLoading: boolean;
  llmMessages: LLMMessage[];
  articles: Article[];
  showBubble: (text: string) => void;
  hideBubble: () => void;
  rememberPhrase: (text: string) => void;
  setCompanion: (id: CompanionId | null) => void;
  openLLM: () => void;
  closeLLM: () => void;
  setLLMLoading: (loading: boolean) => void;
  addLLMMessage: (msg: LLMMessage) => void;
  setArticles: (articles: Article[]) => void;
  resetChat: () => void;
}

export const useCompanionStore = create<CompanionState>((set) => ({
  companionId: null,
  bubbleText: null,
  bubbleVisible: false,
  recentPhrases: [],
  llmMode: false,
  llmLoading: false,
  llmMessages: [],
  articles: [],
  showBubble: (text) =>
    set((state) => ({
      bubbleText: text,
      bubbleVisible: true,
      recentPhrases: [text, ...state.recentPhrases.filter((item) => item !== text)].slice(0, 3),
    })),
  hideBubble: () => set({ bubbleVisible: false }),
  rememberPhrase: (text) =>
    set((state) => ({
      recentPhrases: [text, ...state.recentPhrases.filter((item) => item !== text)].slice(0, 3),
    })),
  setCompanion: (companionId) => set({ companionId }),
  openLLM: () => set({ llmMode: true }),
  closeLLM: () => set({ llmMode: false, llmLoading: false }),
  setLLMLoading: (llmLoading) => set({ llmLoading }),
  addLLMMessage: (msg) =>
    set((state) => ({
      llmMessages: [...state.llmMessages, msg].slice(-10),
    })),
  setArticles: (articles) => set({ articles }),
  resetChat: () => set({ llmMessages: [], articles: [], llmLoading: false }),
}));
