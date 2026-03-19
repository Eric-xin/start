import axios from 'axios'

export interface UserAdmin {
  id: string
  email: string
  username: string
  role: string
  subscription_tier: string
  is_verified: boolean
  created_at: string
}

export interface PortfolioAdmin {
  user_id: string
  username: string
  email: string
  capital: number
  net_worth: number
  peak_net_worth: number
  stage: number
  investor_rank: number
  total_cards_played: number
  income_streak: number
  created_at: string
}

export interface ProgressAdmin {
  user_id: string
  username: string
  email: string
  unlocked_strategies: string[]
  enabled_strategies: string[]
  unlocked_decks: string[]
  enabled_decks: string[]
  total_cards_played: number
}

export interface CardAdmin {
  id: string
  card_id: string
  type: string
  title: string
  body: string
  emoji: string
  stage_min: number
  stage_max: number
  difficulty: number
  card_band_color: string
  is_active: boolean
  left_choice: string
  right_choice: string
  left_lesson: string
  right_lesson: string
  topics: string[]
  linked_traits: string[]
  diagnostic_power: number
  alpha: number
}

export interface StatsResponse {
  total_users: number
  total_portfolios: number
  total_cards_played: number
  total_capital: number
  active_cards: number
}

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export async function login(email: string, password: string): Promise<{ access_token: string }> {
  const res = await api.post('/auth/login', { identifier: email, password })
  return res.data
}

export async function getStats(): Promise<StatsResponse> {
  const res = await api.get('/admin/stats')
  return res.data
}

export async function getUsers(): Promise<UserAdmin[]> {
  const res = await api.get('/admin/users')
  return res.data
}

export async function updateUser(
  id: string,
  data: Partial<{ role: string; subscription_tier: string; is_verified: boolean }>
): Promise<UserAdmin> {
  const res = await api.patch(`/admin/users/${id}`, data)
  return res.data
}

export async function getPortfolios(): Promise<PortfolioAdmin[]> {
  const res = await api.get('/admin/portfolios')
  return res.data
}

export async function updatePortfolio(
  userId: string,
  data: Partial<{
    capital: number
    net_worth: number
    stage: number
    investor_rank: number
    income_streak: number
  }>
): Promise<PortfolioAdmin> {
  const res = await api.patch(`/admin/portfolios/${userId}`, data)
  return res.data
}

export async function getProgress(): Promise<ProgressAdmin[]> {
  const res = await api.get('/admin/progress')
  return res.data
}

export async function updateProgress(
  userId: string,
  data: Partial<{
    unlocked_strategies: string[]
    enabled_strategies: string[]
    unlocked_decks: string[]
    enabled_decks: string[]
  }>
): Promise<ProgressAdmin> {
  const res = await api.patch(`/admin/progress/${userId}`, data)
  return res.data
}

export async function getCards(): Promise<CardAdmin[]> {
  const res = await api.get('/admin/cards')
  return res.data
}

export async function createCard(data: Partial<CardAdmin>): Promise<CardAdmin> {
  const res = await api.post('/admin/cards', data)
  return res.data
}

export async function updateCard(id: string, data: Partial<CardAdmin>): Promise<CardAdmin> {
  const res = await api.patch(`/admin/cards/${id}`, data)
  return res.data
}

export async function deleteCard(id: string): Promise<void> {
  await api.delete(`/admin/cards/${id}`)
}

export async function getConfig(): Promise<Record<string, any>> {
  const res = await api.get('/admin/config')
  return res.data
}

export async function updateConfig(key: string, value: any, description?: string): Promise<void> {
  await api.put(`/admin/config/${key}`, { value, description })
}

export default api
