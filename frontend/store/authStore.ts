import { create } from "zustand";
import { getItem, setItem, deleteItem } from "../services/storage";
import type { UserOut } from "../services/auth";

interface AuthState {
  token: string | null;
  user: UserOut | null;
  isHydrated: boolean;
  setAuth: (token: string, refreshToken: string, user: UserOut) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,

  setAuth: async (token, refreshToken, user) => {
    await setItem("access_token", token);
    await setItem("refresh_token", refreshToken);
    set({ token, user });
  },

  clearAuth: async () => {
    await deleteItem("access_token");
    await deleteItem("refresh_token");
    set({ token: null, user: null });
  },

  hydrate: async () => {
    const token = await getItem("access_token");
    set({ token: token ?? null, isHydrated: true });
  },
}));
