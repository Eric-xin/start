import axios from "axios";
import { getItem, deleteItem } from "./storage";
import { useAuthStore } from "../store/authStore";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const memoryToken = useAuthStore.getState().token;
  const token = memoryToken ?? (await getItem("access_token"));
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
