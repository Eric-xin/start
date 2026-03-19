import axios from "axios";
import { NativeModules, Platform } from "react-native";
import { getItem, deleteItem } from "./storage";

function resolveApiBase(): string {
  // Highest priority: explicit env override.
  const envBase = process.env.EXPO_PUBLIC_API_URL;
  if (envBase) return envBase;

  if (Platform.OS === "web") {
    return "http://localhost:8000";
  }

  // In Expo/native dev, parse Metro bundle URL to discover host machine LAN IP.
  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
  if (scriptURL?.startsWith("http")) {
    try {
      const host = new URL(scriptURL).hostname;
      if (host) return `http://${host}:8000`;
    } catch {
      // Ignore parse failures and fall back below.
    }
  }

  // Emulator/device fallback defaults.
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }
  return "http://127.0.0.1:8000";
}

export const API_BASE = resolveApiBase();

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await deleteItem("access_token");
      await deleteItem("refresh_token");
      // Auth store will detect missing token on next render
    }
    return Promise.reject(error);
  }
);
