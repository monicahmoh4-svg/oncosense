import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,
      isAuthenticated: false,

      login: async (identifier, password) => {
        const res = await api.post('/auth/login', { identifier, password })
        set({
          user:  res.data.user,
          token: res.data.token,
          isAuthenticated: true
        })
        return res.data
      },

      register: async (data) => {
        const res = await api.post('/auth/register', data)
        set({
          user:  res.data.user,
          token: res.data.token,
          isAuthenticated: true
        })
        return res.data
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        localStorage.removeItem('oncosense-auth')
      },

      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),

      getToken: () => get().token,
    }),
    {
      name:    'oncosense-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated })
    }
  )
)
