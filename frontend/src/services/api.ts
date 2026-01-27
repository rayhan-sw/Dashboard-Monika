import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API Services
export const dashboardService = {
  getStats: () => api.get('/api/dashboard/stats'),
  getActivities: (limit: number = 10) => api.get(`/api/dashboard/activities?limit=${limit}`),
  getChartData: (type: string) => api.get(`/api/dashboard/charts/${type}`),
}

export const regionalService = {
  getProvinces: () => api.get('/api/regional/provinces'),
  getUnits: () => api.get('/api/regional/units'),
}
