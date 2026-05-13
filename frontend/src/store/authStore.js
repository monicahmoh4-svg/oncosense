import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      login: async (identifier, password) => {
        set({ loading: true })
        try {
          const res = await api.post('/auth/login', { identifier, password })
          const { user, token } = res.data
          set({ user, token, loading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          return { success: true, user }
        } catch (err) {
          set({ loading: false })
          return { success: false, error: err.response?.data?.error || 'Login failed' }
        }
      },

      register: async (data) => {
        set({ loading: true })
        try {
          const res = await api.post('/auth/register', data)
          const { user, token } = res.data
          set({ user, token, loading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          return { success: true, user }
        } catch (err) {
          set({ loading: false })
          return { success: false, error: err.response?.data?.error || 'Registration failed' }
        }
      },

      logout: () => {
        set({ user: null, token: null })
        delete api.defaults.headers.common['Authorization']
      },

      loadUser: async () => {
        const { token } = get()
        if (!token) return
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        try {
          const res = await api.get('/auth/me')
          set({ user: res.data.user })
        } catch {
          set({ user: null, token: null })
        }
      },

      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } }))
    }),
    {
      name: 'oncosense-auth',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
)
