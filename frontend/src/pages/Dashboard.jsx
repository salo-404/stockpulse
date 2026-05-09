import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  LineChart as LineChartIcon,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { addStock, deleteStock, getPerformance, getStockPrice } from '../lib/api'
import { useToast } from '../context/useToast'

const popularSymbols = ['AAPL', 'TSLA', 'GOOGL', 'AMZN', 'MSFT', 'NVDA']
const chartColors = ['#00d4aa', '#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ec4899']

const numberFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

function formatCurrency(value) {
  return numberFormatter.format(Number.isFinite(value) ? value : 0)
}

function formatPercent(value) {
  const amount = Number.isFinite(value) ? value : 0
  return `${amount >= 0 ? '+' : ''}${compactFormatter.format(amount)}%`
}

function quoteTone(direction) {
  if (direction === 'up') return 'text-profit'
  if (direction === 'down') return 'text-loss'
  return 'text-secondary'
}

function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton rounded-2xl ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-[220px] w-full" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-[120px] w-full" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <SkeletonBlock className="h-[340px] w-full" />
        <SkeletonBlock className="h-[340px] w-full" />
      </div>
      <SkeletonBlock className="h-[420px] w-full" />
    </div>
  )
}

function StatCard({ label, value, helper, icon: Icon, tone = 'neutral' }) {
  const toneClasses = {
    neutral: 'border-[rgba(255,255,255,0.06)]',
    profit: 'border-[rgba(0,212,170,0.22)]',
    loss: 'border-[rgba(255,77,77,0.22)]',
    accent: 'border-[rgba(124,58,237,0.22)]',
  }

  return (
    <div className={`glass-panel rounded-[24px] p-5 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-primary">{value}</p>
          {helper ? <p className="mt-2 text-sm text-secondary">{helper}</p> : null}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(0,212,170,0.12)] bg-[rgba(0,212,170,0.06)] text-accent">
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

const quoteTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="glass-panel rounded-2xl px-4 py-3 text-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-secondary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-2 font-medium text-primary">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

const pieTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="glass-panel rounded-2xl px-4 py-3 text-sm">
      <p className="font-medium text-primary">{payload[0].name}</p>
      <p className="mt-2 text-secondary">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function Dashboard() {
  const { pushToast } = useToast()
  const [performance, setPerformance] = useState(null)
  const [marketQuotes, setMarketQuotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ symbol: '', shares: '', buy_price: '' })
  const [addPreview, setAddPreview] = useState(null)
  const [addPreviewLoading, setAddPreviewLoading] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError] = useState('')
  const [sellState, setSellState] = useState({ holding: null, shares: '' })
  const [sellSubmitting, setSellSubmitting] = useState(false)
  const [sellError, setSellError] = useState('')

  const holdings = useMemo(() => performance?.holdings ?? [], [performance])
  const totalInvested = performance?.total_invested ?? 0
  const currentValue = performance?.total_current_value ?? 0
  const totalPnl = performance?.total_profit_loss ?? 0
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0
  const isPositive = totalPnl >= 0

  const bestPerformer = useMemo(() => {
    if (!holdings.length) return null
    return holdings.reduce((best, holding) => {
      if (!best) return holding
      return holding.profit_loss_pct > best.profit_loss_pct ? holding : best
    }, null)
  }, [holdings])

  const revenueFlowData = useMemo(
    () =>
      holdings.map((holding, index) => ({
        symbol: holding.symbol,
        invested: holding.invested,
        current: holding.current_value,
        pnl: holding.profit_loss,
        color: chartColors[index % chartColors.length],
      })),
    [holdings],
  )

  const allocationData = useMemo(() => {
    const total = holdings.reduce((sum, holding) => sum + holding.current_value, 0)
    return holdings.map((holding, index) => ({
      name: holding.symbol,
      value: holding.current_value,
      percent: total > 0 ? (holding.current_value / total) * 100 : 0,
      color: chartColors[index % chartColors.length],
    }))
  }, [holdings])

  const loadDashboard = useCallback(async (withSpinner = false) => {
    try {
      if (withSpinner) setRefreshing(true)

      const [performanceResponse, ...quoteResponses] = await Promise.all([
        getPerformance(),
        ...popularSymbols.map((symbol) => getStockPrice(symbol).catch(() => null)),
      ])

      setPerformance(performanceResponse.data)

      const nextMarketQuotes = {}
      quoteResponses.forEach((response, index) => {
        if (response?.data) nextMarketQuotes[popularSymbols[index]] = response.data
      })
      setMarketQuotes(nextMarketQuotes)
    } catch (error) {
      pushToast({
        title: 'Dashboard refresh failed',
        message: error.response?.data?.detail || 'Unable to load portfolio data right now.',
        type: 'error',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [pushToast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDashboard])

  useEffect(() => {
    const symbol = addForm.symbol.trim()
    if (!showAddModal || !symbol) {
      return undefined
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setAddPreviewLoading(true)
      try {
        const response = await getStockPrice(addForm.symbol.trim().toUpperCase())
        if (!cancelled) {
          setAddPreview(response.data)
          setAddError('')
        }
      } catch (error) {
        if (!cancelled) {
          setAddPreview(null)
          setAddError(error.response?.data?.detail || 'Live quote unavailable for that symbol.')
        }
      } finally {
        if (!cancelled) setAddPreviewLoading(false)
      }
    }, 420)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [addForm.symbol, showAddModal])

  const openAddModal = (symbol = '', buyPrice = '') => {
    setAddForm({ symbol, shares: '', buy_price: buyPrice })
    setAddError('')
    setAddPreview(null)
    setShowAddModal(true)
  }

  const handleAddStock = async (event) => {
    event.preventDefault()
    const symbol = addForm.symbol.trim().toUpperCase()
    const shares = Number.parseFloat(addForm.shares)
    const buyPrice = Number.parseFloat(addForm.buy_price || addPreview?.price || 0)

    if (!symbol || !shares || !buyPrice) {
      setAddError('Enter a valid symbol, shares, and price.')
      return
    }

    setAddSubmitting(true)
    setAddError('')
    try {
      await addStock(symbol, shares, buyPrice)
      setShowAddModal(false)
      setAddForm({ symbol: '', shares: '', buy_price: '' })
      setAddPreview(null)
      pushToast({
        title: 'Stock added',
        message: `${symbol} has been added to your portfolio.`,
        type: 'success',
      })
      await loadDashboard(true)
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to add stock.'
      setAddError(message)
      pushToast({ title: 'Add stock failed', message, type: 'error' })
    } finally {
      setAddSubmitting(false)
    }
  }

  const openSellModal = (holding) => {
    setSellState({ holding, shares: String(holding.shares) })
    setSellError('')
  }

  const handleSellStock = async (event) => {
    event.preventDefault()
    if (!sellState.holding) return

    const shares = Number.parseFloat(sellState.shares)
    if (!shares || shares <= 0) {
      setSellError('Enter a valid number of shares to sell.')
      return
    }

    if (shares > sellState.holding.shares) {
      setSellError('You cannot sell more shares than you hold.')
      return
    }

    setSellSubmitting(true)
    setSellError('')
    try {
      await deleteStock(sellState.holding.id, shares)
      setSellState({ holding: null, shares: '' })
      pushToast({
        title: 'Position updated',
        message: `${sellState.holding.symbol} was sold successfully.`,
        type: 'success',
      })
      await loadDashboard(true)
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to sell stock.'
      setSellError(message)
      pushToast({ title: 'Sell failed', message, type: 'error' })
    } finally {
      setSellSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-secondary">Portfolio command center</p>
          <h1 className="mt-3 text-3xl font-semibold text-primary md:text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-secondary">
            Live holdings, market quotes, and portfolio analytics in a premium glassmorphism layout.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="glass-panel inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-primary transition-all hover:border-[rgba(0,212,170,0.22)] hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing' : 'Refresh quotes'}
          </button>
          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-background transition-all"
            style={{
              background: 'linear-gradient(135deg, #00d4aa, #7c3aed)',
              boxShadow: '0 16px 50px rgba(0, 212, 170, 0.2)',
            }}
          >
            <Plus size={16} />
            Add stock
          </button>
        </div>
      </div>

      {loading && !performance ? (
        <DashboardSkeleton />
      ) : holdings.length === 0 ? (
        <div className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="flex max-w-2xl flex-col gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-[28px] border border-[rgba(0,212,170,0.12)] bg-[rgba(0,212,170,0.06)] text-accent">
              <BarChart3 size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-primary">Build your first position</h2>
              <p className="mt-3 text-sm leading-6 text-secondary">
                Add a stock to start seeing live quotes, portfolio value, and allocation charts.
              </p>
            </div>
            <button
              onClick={() => openAddModal()}
              className="inline-flex w-fit items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-background"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #7c3aed)' }}
            >
              <Plus size={16} />
              Add your first stock
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="glass-panel rounded-[32px] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.35em] text-secondary">Portfolio value</p>
                <div className="mt-4 flex flex-wrap items-end gap-4">
                  <h2 className="text-4xl font-semibold text-primary md:text-6xl">{formatCurrency(currentValue)}</h2>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                      isPositive
                        ? 'border-[rgba(0,212,170,0.18)] bg-[rgba(0,212,170,0.08)] text-profit'
                        : 'border-[rgba(255,77,77,0.18)] bg-[rgba(255,77,77,0.08)] text-loss'
                    }`}
                  >
                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {formatPercent(totalPnlPct)} today
                  </div>
                </div>
                <p className="mt-4 max-w-xl text-sm leading-6 text-secondary">
                  Live portfolio performance with current pricing pulled from Yahoo Finance through the backend.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px] lg:grid-cols-1">
                <div className="rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">Best performer</p>
                  <p className="mt-3 text-2xl font-semibold text-primary">
                    {bestPerformer ? bestPerformer.symbol : '—'}
                  </p>
                  <p className={`mt-2 text-sm font-medium ${bestPerformer?.profit_loss_pct >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {bestPerformer ? formatPercent(bestPerformer.profit_loss_pct) : 'No positions'}
                  </p>
                </div>
                <div className="rounded-[28px] border border-[rgba(124,58,237,0.16)] bg-[rgba(124,58,237,0.08)] p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">Net P&L</p>
                  <p className={`mt-3 text-2xl font-semibold ${isPositive ? 'text-profit' : 'text-loss'}`}>
                    {formatCurrency(totalPnl)}
                  </p>
                  <p className="mt-2 text-sm text-secondary">{formatCurrency(totalInvested)} invested</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <StatCard label="Total invested" value={formatCurrency(totalInvested)} icon={Banknote} />
            <StatCard label="Current value" value={formatCurrency(currentValue)} icon={BadgeDollarSign} tone="accent" />
            <StatCard
              label="Total P&L"
              value={formatCurrency(totalPnl)}
              helper={formatPercent(totalPnlPct)}
              icon={isPositive ? ArrowUpRight : ArrowDownRight}
              tone={isPositive ? 'profit' : 'loss'}
            />
            <StatCard
              label="Best performer"
              value={bestPerformer?.symbol || '—'}
              helper={bestPerformer ? `${formatPercent(bestPerformer.profit_loss_pct)} on ${bestPerformer.shares} shares` : 'No holdings yet'}
              icon={LineChartIcon}
              tone="accent"
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="glass-panel rounded-[32px] p-6 md:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">Market overview</p>
                  <h2 className="mt-2 text-xl font-semibold text-primary">Live quotes</h2>
                </div>
                <p className="text-xs text-secondary">Fetched from backend</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {popularSymbols.map((symbol) => {
                  const quote = marketQuotes[symbol]
                  return (
                    <button
                      key={symbol}
                      onClick={() => openAddModal(symbol, quote?.price ? String(quote.price) : '')}
                      className="rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4 text-left transition-all hover:border-[rgba(0,212,170,0.22)] hover:bg-[rgba(0,212,170,0.05)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-primary">{symbol}</p>
                          <p className="mt-1 text-xs text-secondary">Yahoo Finance live quote</p>
                        </div>
                        <div className={`text-xs font-medium ${quoteTone(quote?.direction)}`}>
                          {quote?.direction === 'up' ? 'Up' : quote?.direction === 'down' ? 'Down' : 'Flat'}
                        </div>
                      </div>
                      <div className="mt-5 flex items-end justify-between gap-3">
                        <p className="text-2xl font-semibold text-primary">
                          {quote ? formatCurrency(quote.price) : '—'}
                        </p>
                        <div className={`text-right text-sm font-medium ${quoteTone(quote?.direction)}`}>
                          {quote?.change_percent !== null && quote?.change_percent !== undefined
                            ? `${quote.change >= 0 ? '+' : ''}${compactFormatter.format(quote.change)} (${formatPercent(quote.change_percent)})`
                            : '—'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="glass-panel rounded-[32px] p-6 md:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">Allocation</p>
                  <h2 className="mt-2 text-xl font-semibold text-primary">Portfolio mix</h2>
                </div>
                <p className="text-xs text-secondary">Dollar value by holding</p>
              </div>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={78}
                      outerRadius={108}
                      paddingAngle={2}
                      stroke="rgba(255,255,255,0.08)"
                    >
                      {allocationData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={pieTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {allocationData.map((entry) => (
                  <div key={entry.name} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <p className="text-sm font-medium text-primary">{entry.name}</p>
                      </div>
                      <p className="text-xs text-secondary">{formatPercent(entry.percent)}</p>
                    </div>
                    <p className="mt-2 text-sm text-secondary">{formatCurrency(entry.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-[32px] p-6 md:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">Revenue flow</p>
                <h2 className="mt-2 text-xl font-semibold text-primary">Current vs invested</h2>
              </div>
              <p className="text-xs text-secondary">Interactive hover reveals exact values</p>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="symbol" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value.toFixed(0)}`} />
                  <Tooltip content={quoteTooltip} />
                  <Legend wrapperStyle={{ paddingTop: 16 }} />
                  <Bar dataKey="invested" name="Invested" radius={[10, 10, 0, 0]} fill="rgba(124,58,237,0.55)" />
                  <Bar dataKey="current" name="Current value" radius={[10, 10, 0, 0]} fill="#00d4aa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="glass-panel overflow-hidden rounded-[32px]">
            <div className="flex flex-col gap-2 border-b border-[rgba(255,255,255,0.06)] px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">Holdings</p>
                <h2 className="mt-2 text-xl font-semibold text-primary">Managed positions</h2>
              </div>
              <p className="text-sm text-secondary">Hover a row to reveal quick actions</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] text-xs uppercase tracking-[0.28em] text-secondary">
                    <th className="px-6 py-4 font-medium">Stock</th>
                    <th className="px-6 py-4 font-medium">Shares</th>
                    <th className="px-6 py-4 font-medium">Buy price</th>
                    <th className="px-6 py-4 font-medium">Live price</th>
                    <th className="px-6 py-4 font-medium">P&L</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => (
                    <tr key={holding.id || `${holding.symbol}-${index}`} className="group border-b border-[rgba(255,255,255,0.04)] transition-colors hover:bg-[rgba(255,255,255,0.02)]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(0,212,170,0.12)] bg-[rgba(0,212,170,0.06)] text-sm font-semibold text-accent">
                            {holding.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-primary">{holding.symbol}</p>
                            <p className="text-xs text-secondary">Live holdings row</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-primary">{compactFormatter.format(holding.shares)}</td>
                      <td className="px-6 py-4 text-sm text-secondary">{formatCurrency(holding.buy_price)}</td>
                      <td className="px-6 py-4 text-sm text-primary">{formatCurrency(holding.current_price)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`text-sm font-semibold ${holding.profit_loss >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {holding.profit_loss >= 0 ? '+' : ''}{formatCurrency(holding.profit_loss)}
                          </span>
                          <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${holding.profit_loss >= 0 ? 'bg-[rgba(0,212,170,0.08)] text-profit' : 'bg-[rgba(255,77,77,0.08)] text-loss'}`}>
                            {holding.profit_loss >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {formatPercent(holding.profit_loss_pct)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-100 transition-all md:opacity-0 md:group-hover:opacity-100">
                          <button
                            onClick={() => openAddModal(holding.symbol, String(holding.current_price))}
                            className="rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs font-medium text-secondary transition-colors hover:border-[rgba(0,212,170,0.22)] hover:text-accent"
                          >
                            Buy more
                          </button>
                          <button
                            onClick={() => openSellModal(holding)}
                            className="rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs font-medium text-secondary transition-colors hover:border-[rgba(255,77,77,0.22)] hover:text-loss"
                          >
                            Sell
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await deleteStock(holding.id)
                                pushToast({
                                  title: 'Position removed',
                                  message: `${holding.symbol} was deleted from the portfolio.`,
                                  type: 'success',
                                })
                                await loadDashboard(true)
                              } catch (error) {
                                pushToast({
                                  title: 'Delete failed',
                                  message: error.response?.data?.detail || 'Unable to delete position.',
                                  type: 'error',
                                })
                              }
                            }}
                            className="rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs font-medium text-secondary transition-colors hover:border-[rgba(255,77,77,0.22)] hover:text-loss"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.72)] px-4 py-8 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xl rounded-[32px] p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">Add stock</p>
                <h3 className="mt-2 text-2xl font-semibold text-primary">Create a new position</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-secondary transition-colors hover:text-primary">
                ×
              </button>
            </div>

            <form onSubmit={handleAddStock} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-secondary">Symbol</label>
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                  <input
                    value={addForm.symbol}
                    onChange={(event) => {
                      const nextSymbol = event.target.value.toUpperCase()
                      setAddForm((current) => ({ ...current, symbol: nextSymbol }))
                      if (!nextSymbol.trim()) {
                        setAddPreview(null)
                        setAddPreviewLoading(false)
                      }
                    }}
                    placeholder="AAPL"
                    className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] py-3 pl-11 pr-4 text-primary outline-none transition-colors placeholder:text-secondary focus:border-[rgba(0,212,170,0.25)]"
                    required
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {popularSymbols.map((symbol) => (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => setAddForm((current) => ({ ...current, symbol }))}
                      className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-[rgba(0,212,170,0.22)] hover:text-accent"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-secondary">Shares</label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={addForm.shares}
                    onChange={(event) => setAddForm((current) => ({ ...current, shares: event.target.value }))}
                    placeholder="10"
                    className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-primary outline-none transition-colors placeholder:text-secondary focus:border-[rgba(0,212,170,0.25)]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-secondary">Buy price</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={addForm.buy_price}
                      onChange={(event) => setAddForm((current) => ({ ...current, buy_price: event.target.value }))}
                      placeholder={addPreview?.price ? String(addPreview.price) : '150.00'}
                      className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-primary outline-none transition-colors placeholder:text-secondary focus:border-[rgba(0,212,170,0.25)]"
                      required
                    />
                    {addPreview?.price ? (
                      <button
                        type="button"
                        onClick={() => setAddForm((current) => ({ ...current, buy_price: String(addPreview.price) }))}
                        className="rounded-2xl border border-[rgba(0,212,170,0.2)] px-3 text-xs font-medium text-accent transition-colors hover:bg-[rgba(0,212,170,0.08)]"
                      >
                        Use live
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-[28px] p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-secondary">Live preview</p>
                {addPreviewLoading ? (
                  <p className="mt-3 text-sm text-secondary">Fetching live price...</p>
                ) : addPreview ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-secondary">Live price</p>
                      <p className="mt-1 text-lg font-semibold text-primary">{formatCurrency(addPreview.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Estimated cost</p>
                      <p className="mt-1 text-lg font-semibold text-primary">
                        {formatCurrency((Number.parseFloat(addForm.shares) || 0) * addPreview.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Direction</p>
                      <p className={`mt-1 text-lg font-semibold ${quoteTone(addPreview.direction)}`}>
                        {addPreview.direction === 'up' ? 'Up' : addPreview.direction === 'down' ? 'Down' : 'Flat'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-secondary">Type a symbol to preview the current quote.</p>
                )}
              </div>

              {addError ? <p className="text-sm text-loss">{addError}</p> : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.08)] px-4 py-3 text-sm font-medium text-secondary transition-colors hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-background transition-opacity disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00d4aa, #7c3aed)' }}
                >
                  {addSubmitting ? 'Adding...' : 'Add position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {sellState.holding ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.72)] px-4 py-8 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-[32px] p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">Sell position</p>
                <h3 className="mt-2 text-2xl font-semibold text-primary">{sellState.holding.symbol}</h3>
              </div>
              <button
                onClick={() => setSellState({ holding: null, shares: '' })}
                className="text-secondary transition-colors hover:text-primary"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSellStock} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-secondary">Held shares</p>
                  <p className="mt-2 text-xl font-semibold text-primary">{compactFormatter.format(sellState.holding.shares)}</p>
                </div>
                <div className="rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-secondary">Live price</p>
                  <p className="mt-2 text-xl font-semibold text-primary">{formatCurrency(sellState.holding.current_price)}</p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-secondary">Shares to sell</label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={sellState.shares}
                  onChange={(event) => setSellState((current) => ({ ...current, shares: event.target.value }))}
                  className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-primary outline-none transition-colors placeholder:text-secondary focus:border-[rgba(255,77,77,0.25)]"
                  required
                />
              </div>

              <div className="glass-panel rounded-[28px] p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-secondary">Profit / loss preview</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-secondary">Estimated proceeds</p>
                    <p className="mt-1 text-lg font-semibold text-primary">
                      {formatCurrency((Number.parseFloat(sellState.shares) || 0) * sellState.holding.current_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Estimated P&L</p>
                    <p className={`mt-1 text-lg font-semibold ${(sellState.holding.current_price - sellState.holding.buy_price) >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatCurrency((Number.parseFloat(sellState.shares) || 0) * (sellState.holding.current_price - sellState.holding.buy_price))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Remaining shares</p>
                    <p className="mt-1 text-lg font-semibold text-primary">
                      {compactFormatter.format(Math.max(sellState.holding.shares - (Number.parseFloat(sellState.shares) || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>

              {sellError ? <p className="text-sm text-loss">{sellError}</p> : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSellState({ holding: null, shares: '' })}
                  className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.08)] px-4 py-3 text-sm font-medium text-secondary transition-colors hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sellSubmitting}
                  className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-background transition-opacity disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #ff4d4d, #7c3aed)' }}
                >
                  {sellSubmitting ? 'Selling...' : 'Confirm sell'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}