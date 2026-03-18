import { api } from "./api";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserOut {
  id: string;
  email: string;
  username: string;
  role: string;
  subscription_tier: string;
  is_verified: boolean;
  created_at: string;
}

export async function register(email: string, username: string, password: string): Promise<UserOut> {
  const resp = await api.post<UserOut>("/api/auth/register", { email, username, password });
  return resp.data;
}

export async function login(identifier: string, password: string): Promise<TokenResponse> {
  const resp = await api.post<TokenResponse>("/api/auth/login", { identifier, password });
  return resp.data;
}

export async function getMe(token?: string): Promise<UserOut> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const resp = await api.get<UserOut>("/api/users/me", { headers });
  return resp.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/api/auth/forgot-password", { email });
}
