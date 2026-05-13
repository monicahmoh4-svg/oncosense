import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('oncosense-auth')
    if (stored) {
      try {
        const { state } = JSON.parse(stored)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      } catch {}
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('oncosense-auth')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Assessment service
export const assessmentService = {
  create: (data) => api.post('/assessments', data),
  getAll: () => api.get('/assessments'),
  getLatest: () => api.get('/assessments/latest'),
  getById: (id) => api.get(`/assessments/${id}`),
}

// ── Profile service
export const profileService = {
  get: () => api.get('/profiles/me'),
  update: (data) => api.put('/profiles/me', data),
}

// ── Consultation service
export const consultationService = {
  create: (data) => api.post('/consultations', data),
  getAll: () => api.get('/consultations'),
  getById: (id) => api.get(`/consultations/${id}`),
  complete: (id, data) => api.patch(`/consultations/${id}/complete`, data),
  getMessages: (id) => api.get(`/messages/${id}`),
}

// ── Clinic service
export const clinicService = {
  getAll: (params) => api.get('/clinics', { params }),
}

// ── Recommendation service
export const recommendationService = {
  getAll: () => api.get('/recommendations'),
  complete: (id) => api.patch(`/recommendations/${id}/complete`),
}

// ── Notification service
export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
}

// ── Admin service
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getHighRiskUsers: () => api.get('/admin/high-risk-users'),
  getAssessments: (params) => api.get('/admin/assessments', { params }),
  getCancerTypes: () => api.get('/admin/analytics/cancer-types'),
  toggleUser: (id) => api.patch(`/admin/users/${id}/toggle`),
}
