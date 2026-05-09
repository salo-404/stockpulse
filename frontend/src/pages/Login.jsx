import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { login, register } from '../lib/api'
import { TrendingUp, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (isLogin) {
        const res = await login(form.email, form.password)
        loginUser(res.data.access_token)
        navigate('/dashboard')
      } else {
        await register(form.username, form.email, form.password)
        setSuccess('Account created. Please login.')
        setIsLogin(true)
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Something went wrong')
      
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-border relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(0,212,170,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
            <TrendingUp size={18} className="text-background" strokeWidth={2.5} />
          </div>
          <span className="text-primary font-bold text-lg tracking-tight">StockPulse</span>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-primary leading-tight mb-4">
            Your portfolio,<br />
            <span style={{color: '#00d4aa'}}>intelligently</span><br />
            managed.
          </h1>
          <p className="text-secondary text-lg leading-relaxed max-w-md">
            Real-time stock tracking, live P&L calculations, and an AI analyst that understands your investments.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mt-10">
            <div>
              <p className="text-2xl font-bold text-primary">Real-time</p>
              <p className="text-secondary text-sm">Market Data</p>
            </div>
            <div className="w-px bg-border"></div>
            <div>
              <p className="text-2xl font-bold text-primary">AI-powered</p>
              <p className="text-secondary text-sm">Analysis</p>
            </div>
            <div className="w-px bg-border"></div>
            <div>
              <p className="text-2xl font-bold text-primary">Secure</p>
              <p className="text-secondary text-sm">JWT Auth</p>
            </div>
          </div>
        </div>

        <p className="text-secondary text-xs relative z-10">
          StockPulse — Built for serious investors
        </p>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <TrendingUp size={18} className="text-background" strokeWidth={2.5} />
            </div>
            <span className="text-primary font-bold text-lg tracking-tight">StockPulse</span>
          </div>

          <h2 className="text-2xl font-bold text-primary mb-1">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-secondary text-sm mb-8">
            {isLogin ? 'Enter your credentials to continue' : 'Start tracking your portfolio today'}
          </p>

          {/* Toggle */}
          <div className="flex bg-card border border-border rounded-xl p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); setSuccess('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? 'bg-accent text-background' : 'text-secondary hover:text-primary'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setSuccess('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? 'bg-accent text-background' : 'text-secondary hover:text-primary'}`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
                <input
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-primary placeholder-secondary text-sm focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email address"
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-primary placeholder-secondary text-sm focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-primary placeholder-secondary text-sm focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-loss text-sm">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-accent text-sm">
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #00d4aa, #00b894)',
                color: '#0a0a0f',
                boxShadow: '0 0 20px rgba(0,212,170,0.25)'
              }}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}