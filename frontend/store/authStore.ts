import { create } from "zustand";
import { getItem, setItem, deleteItem } from "../services/storage";
import type { UserOut } from "../services/auth";

interface AuthState {
  token: string | null;
  user: UserOut | null;
  isHydrated: boolean;
  skipInvestingIntro: boolean;
  setAuth: (token: string, refreshToken: string, user: UserOut) => Promise<void>;
  setUser: (user: UserOut) => void;
  setSkipInvestingIntro: (skip: boolean) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,
  skipInvestingIntro: false,

  setUser: (user) => set({ user }),

  setAuth: async (token, refreshToken, user) => {
    await setItem("access_token", token);
    await setItem("refresh_token", refreshToken);
    set({ token, user });
  },

  setSkipInvestingIntro: async (skip) => {
    await setItem("skip_investing_intro", skip ? "1" : "0");
    set({ skipInvestingIntro: skip });
  },

  clearAuth: async () => {
    await deleteItem("access_token");
    await deleteItem("refresh_token");
    set({ token: null, user: null });
  },

  hydrate: async () => {
    const [token, skipFlag] = await Promise.all([
      getItem("access_token"),
      getItem("skip_investing_intro"),
    ]);
    set({
      token: token ?? null,
      skipInvestingIntro: skipFlag === "1",
      isHydrated: true,
    });
  },
}));
