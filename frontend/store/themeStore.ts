import { create } from "zustand";
import { getItem, setItem } from "../services/storage";

export type ThemeMode = "normal" | "pro";

interface ThemeState {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "cardecon-theme-mode";

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "pro",
  hydrated: false,
  setMode: (mode) => {
    set({ mode });
    void setItem(STORAGE_KEY, mode);
  },
  toggle: () => {
    const nextMode = get().mode === "normal" ? "pro" : "normal";
    set({ mode: nextMode });
    void setItem(STORAGE_KEY, nextMode);
  },
  hydrate: async () => {
    try {
      const storedMode = await getItem(STORAGE_KEY);
      if (storedMode === "normal" || storedMode === "pro") {
        set({ mode: storedMode, hydrated: true });
        return;
      }
    } catch {}
    set({ hydrated: true });
  },
}));

void useThemeStore.getState().hydrate();
