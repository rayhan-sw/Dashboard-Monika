import { create } from 'zustand'

interface AppState {
  user: {
    id: string
    username: string
    role: string
  } | null
  isLoading: boolean
  error: string | null
  setUser: (user: AppState['user']) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null })
  },
}))
