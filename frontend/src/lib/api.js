import axios from 'axios'

const BASE_URL = 'http://localhost:8080'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const register = (username, email, password) =>
  api.post('/auth/register', { username, email, password })

// Portfolio
export const getPortfolio = () => api.get('/portfolio/')
export const addStock = (symbol, shares, buy_price) =>
  api.post('/portfolio/add', { symbol, shares, buy_price })
export const deleteStock = (id, shares) =>
  api.delete(`/portfolio/${id}`, shares !== undefined ? { params: { shares } } : undefined)

// Stocks
export const getPerformance = () => api.get('/stocks/portfolio/performance')
export const getStockPrice = (symbol) => api.get(`/stocks/price/${symbol}`)

// AI
export const analyzePortfolio = (question) =>
  api.post('/ai/analyze', { question })

export default api