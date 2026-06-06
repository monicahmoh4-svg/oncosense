import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token on every request
api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem('oncosense-auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        const token  = parsed?.state?.token || parsed?.token
        if (token) config.headers.Authorization = 'Bearer ' + token
      }
    } catch {}
    return config
  },
  (error) => Promise.reject(error)
)

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

export const assessmentService = {
  create:    (data) => api.post('/assessments', data),
  getAll:    ()     => api.get('/assessments'),
  getLatest: ()     => api.get('/assessments/latest'),
  getById:   (id)   => api.get('/assessments/' + id),
}

export const profileService = {
  get:    ()     => api.get('/profiles/me'),
  update: (data) => api.put('/profiles/me', data),
}

export const consultationService = {
  create:      (data)     => api.post('/consultations', data),
  getAll:      ()         => api.get('/consultations'),
  getById:     (id)       => api.get('/consultations/' + id),
  complete:    (id, data) => api.patch('/consultations/' + id + '/complete', data),
  getMessages: (id)       => api.get('/messages/' + id),
}

export const clinicService = {
  getAll:     (params)  => api.get('/clinics', { params }),
  getCounties:(country) => api.get('/clinics/counties', { params: { country: country || 'Kenya' } }),
}

export const imageService = {
  analyze: (formData) => api.post('/image-screening/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/image-screening/my-screenings'),
}

export const recommendationService = {
  getAll:   ()   => api.get('/recommendations'),
  complete: (id) => api.patch('/recommendations/' + id + '/complete'),
}

export const notificationService = {
  getAll:   ()   => api.get('/notifications'),
  markRead: (id) => api.patch('/notifications/' + id + '/read'),
}

export const adminService = {
  getDashboard:   ()       => api.get('/admin/dashboard'),
  getUsers:       (params) => api.get('/admin/users', { params }),
  getAssessments: (params) => api.get('/admin/assessments', { params }),
  getCancerTypes: ()       => api.get('/admin/analytics/cancer-types'),
  toggleUser:     (id)     => api.patch('/admin/users/' + id + '/toggle'),
}
