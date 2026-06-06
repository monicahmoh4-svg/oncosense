import { create } from 'zustand'
import api from '../services/api'

// Simple store without persist middleware to avoid import path issues
// Uses localStorage directly for persistence

function loadState() {
  try {
    const raw = localStorage.getItem('oncosense-auth')
    if (!raw) return { user: null, token: null, isAuthenticated: false }
    const parsed = JSON.parse(raw)
    const state  = parsed?.state || parsed
    return {
      user:  state.user  || null,
      token: state.token || null,
      isAuthenticated: !!(state.token && state.user),
    }
  } catch {
    return { user: null, token: null, isAuthenticated: false }
  }
}

function saveState(user, token) {
  try {
    localStorage.setItem('oncosense-auth', JSON.stringify({
      state: { user, token, isAuthenticated: !!(token && user) }
    }))
  } catch {}
}

const initial = loadState()

export const useAuthStore = create((set, get) => ({
  user:            initial.user,
  token:           initial.token,
  isAuthenticated: initial.isAuthenticated,

  login: async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password })
    const { user, token } = res.data
    saveState(user, token)
    set({ user, token, isAuthenticated: true })
    return res.data
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data)
    const { user, token } = res.data
    saveState(user, token)
    set({ user, token, isAuthenticated: true })
    return res.data
  },

  logout: () => {
    localStorage.removeItem('oncosense-auth')
    set({ user: null, token: null, isAuthenticated: false })
  },

  updateUser: (userData) => {
    const user = { ...get().user, ...userData }
    saveState(user, get().token)
    set({ user })
  },

  getToken: () => get().token,
}))
