import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { getMe } from "../services/auth";

export function useAuth() {
  const { token, user, isHydrated, hydrate, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) {
      hydrate().then(async () => {
        const t = useAuthStore.getState().token;
        if (t && !user) {
          try {
            const me = await getMe();
            useAuthStore.setState({ user: me });
          } catch {
            await clearAuth();
          }
        }
      });
    }
  }, [isHydrated]);

  return { token, user, isHydrated, clearAuth };
}
