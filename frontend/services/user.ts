import { api } from "./api";

export interface UserData {
  id: string;
  email: string;
  username: string;
  role: string;
  subscription_tier: string;
  is_verified: boolean;
  created_at: string;
}

export async function updateUser(data: { username?: string; email?: string }): Promise<UserData> {
  const resp = await api.patch<UserData>("/api/users/me", data);
  return resp.data;
}

export async function changePassword(
  current_password: string,
  new_password: string
): Promise<void> {
  await api.post("/api/users/me/change-password", { current_password, new_password });
}
