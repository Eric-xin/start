import { api } from "./api";

export interface TraitsData {
  risk_appetite: number;
  fomo_sensitivity: number;
  loss_aversion: number;
  patience: number;
  diversification_bias: number;
  overconfidence: number;
}

export interface PersonaSnapshotData {
  id: number;
  persona_id: string;
  cards_played: number;
  traits: Record<string, number>;
  pca_x: number | null;
  pca_y: number | null;
  created_at: string;
}

export interface PersonaData {
  id: string;
  user_id: string;
  name: string;
  cards_played: number;
  is_active: boolean;
  traits: TraitsData | null;
  interpretation: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrajectoryData {
  persona_id: string;
  snapshots: PersonaSnapshotData[];
  pca_variance_explained: number[];
}

export async function listPersonas(): Promise<PersonaData[]> {
  const resp = await api.get<PersonaData[]>("/api/personas");
  return resp.data;
}

export async function createPersona(name: string): Promise<PersonaData> {
  const resp = await api.post<PersonaData>("/api/personas", { name });
  return resp.data;
}

export async function getPersona(id: string): Promise<PersonaData> {
  const resp = await api.get<PersonaData>(`/api/personas/${id}`);
  return resp.data;
}

export async function updatePersona(
  id: string,
  data: { name?: string; is_active?: boolean }
): Promise<PersonaData> {
  const resp = await api.put<PersonaData>(`/api/personas/${id}`, data);
  return resp.data;
}

export async function deletePersona(id: string): Promise<void> {
  await api.delete(`/api/personas/${id}`);
}

export async function getTrajectory(id: string): Promise<TrajectoryData> {
  const resp = await api.get<TrajectoryData>(`/api/personas/${id}/trajectory`);
  return resp.data;
}
