import { useEffect, useMemo, useRef, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { ArrowRight, BotMessageSquare, SendHorizonal, Sparkles } from 'lucide-react'
import { analyzePortfolio, getPerformance } from '../lib/api'
import { useToast } from '../context/useToast'

const suggestions = [
  'How is my portfolio positioned right now?',
  'Which holding is driving the most risk?',
  'What should I monitor this week?',
  'Where is my biggest concentration?',
]

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

function cleanAiResponse(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[>#`]/g, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .trim()
}

function Sparkline({ holding }) {
  const series = useMemo(() => {
    const base = holding.current_value
    const swing = holding.current_value * 0.02
    return [
      base - swing * 1.6,
      base - swing * 0.7,
      base - swing * 0.2,
      base + swing * 0.35,
      base + swing * 0.8,
      base + (holding.profit_loss >= 0 ? swing : -swing * 0.8),
    ].map((value, index) => ({ name: index + 1, value: Number(value.toFixed(2)) }))
  }, [holding])

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series}>
          <XAxis dataKey="name" hide />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null
              return (
                <div className="glass-panel rounded-2xl px-3 py-2 text-xs text-primary">
                  {formatCurrency(payload[0].value)}
                </div>
              )
            }}
          />
          <Line type="monotone" dataKey="value" stroke={holding.profit_loss >= 0 ? '#00d4aa' : '#ff4d4d'} strokeWidth={2.4} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function AI() {
  const { pushToast } = useToast()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'I am ready to analyze your portfolio. Ask for concentration, risk, or performance insights.',
    },
  ])
  const [question, setQuestion] = useState('')
  const [portfolio, setPortfolio] = useState(null)
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    let mounted = true
    getPerformance()
      .then((response) => {
        if (mounted) setPortfolio(response.data)
      })
      .catch((error) => {
        pushToast({
          title: 'Portfolio load failed',
          message: error.response?.data?.detail || 'Unable to load portfolio summary.',
          type: 'error',
        })
      })
      .finally(() => {
        if (mounted) setLoadingPortfolio(false)
      })

    return () => {
      mounted = false
    }
  }, [pushToast])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const holdings = useMemo(() => portfolio?.holdings ?? [], [portfolio])

  const portfolioCards = useMemo(() => {
    return holdings.map((holding) => ({
      ...holding,
      sparklineId: `${holding.symbol}-${holding.id || holding.symbol}`,
    }))
  }, [holdings])

  const sendMessage = async (overrideQuestion = '') => {
    const content = (overrideQuestion || question).trim()
    if (!content || sending) return

    setMessages((current) => [...current, { role: 'user', text: content }])
    setQuestion('')
    setSending(true)

    try {
      const response = await analyzePortfolio(content)
      setMessages((current) => [...current, { role: 'assistant', text: cleanAiResponse(response.data.answer) }])
    } catch (error) {
      const message = error.response?.data?.detail || 'AI analysis is temporarily unavailable.'
      setMessages((current) => [...current, { role: 'assistant', text: cleanAiResponse(message) }])
      pushToast({ title: 'AI analyst failed', message, type: 'error' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-secondary">AI desk</p>
          <h1 className="mt-3 text-3xl font-semibold text-primary md:text-4xl">AI Analyst</h1>
          <p className="mt-2 max-w-2xl text-sm text-secondary">
            Portfolio-aware chat with clean responses, quick prompts, and live summary cards.
          </p>
        </div>
        <div className="glass-panel rounded-full px-4 py-2 text-sm text-secondary">
          Powered by <span className="text-primary">Llama 3.1</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="glass-panel rounded-[32px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">Portfolio summary</p>
                <h2 className="mt-2 text-lg font-semibold text-primary">Snapshot</h2>
              </div>
              <BotMessageSquare size={20} className="text-accent" />
            </div>

            {loadingPortfolio ? (
              <div className="mt-5 space-y-3">
                <div className="skeleton h-24 rounded-[24px]" />
                <div className="skeleton h-24 rounded-[24px]" />
                <div className="skeleton h-24 rounded-[24px]" />
              </div>
            ) : portfolioCards.length > 0 ? (
              <div className="mt-5 space-y-3">
                {portfolioCards.map((holding) => (
                  <article key={holding.sparklineId} className="rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">{holding.symbol}</p>
                        <p className="mt-1 text-xs text-secondary">{holding.shares} shares</p>
                      </div>
                      <div className={`text-sm font-semibold ${holding.profit_loss >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {holding.profit_loss >= 0 ? '+' : ''}{formatCurrency(holding.profit_loss)}
                      </div>
                    </div>
                    <div className="mt-3">
                      <Sparkline holding={holding} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-secondary">
                      <span>Buy {formatCurrency(holding.buy_price)}</span>
                      <span>Live {formatCurrency(holding.current_price)}</span>
                    </div>
                  </article>
                ))}

                <div className="rounded-[24px] border border-[rgba(0,212,170,0.14)] bg-[rgba(0,212,170,0.06)] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">Portfolio P&L</p>
                  <p className={`mt-2 text-2xl font-semibold ${portfolio.total_profit_loss >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {portfolio.total_profit_loss >= 0 ? '+' : ''}{formatCurrency(portfolio.total_profit_loss)}
                  </p>
                  <p className="mt-2 text-sm text-secondary">Real-time portfolio performance.</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-secondary">
                No holdings yet. Add a stock to unlock AI commentary.
              </div>
            )}
          </section>
        </aside>

        <section className="glass-panel flex min-h-[760px] flex-col overflow-hidden rounded-[32px]">
          <header className="border-b border-[rgba(255,255,255,0.06)] px-6 py-5 md:px-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">Conversation</p>
                <h2 className="mt-2 text-xl font-semibold text-primary">Ask about your portfolio</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[rgba(0,212,170,0.14)] bg-[rgba(0,212,170,0.06)] px-3 py-2 text-xs text-secondary">
                <Sparkles size={14} className="text-accent" />
                AI-guided market analysis
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6 md:px-7">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-3xl rounded-[26px] px-4 py-3 text-sm leading-6 ${
                      message.role === 'user'
                        ? 'bg-[linear-gradient(135deg,#00d4aa,#7c3aed)] text-background'
                        : 'border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-primary'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              ))}

              {sending ? (
                <div className="flex justify-start">
                  <div className="rounded-[26px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-secondary">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:240ms]" />
                      Thinking through your portfolio...
                    </span>
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-[rgba(255,255,255,0.06)] px-6 py-4 md:px-7">
            <div className="mb-4 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs font-medium text-secondary transition-colors hover:border-[rgba(0,212,170,0.2)] hover:text-accent"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
                placeholder="Ask the analyst about concentration, risk, or performance..."
                className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-primary outline-none transition-colors placeholder:text-secondary focus:border-[rgba(0,212,170,0.25)]"
              />
              <button
                onClick={() => sendMessage()}
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-background transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #00d4aa, #7c3aed)' }}
              >
                <SendHorizonal size={16} />
                Send
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}