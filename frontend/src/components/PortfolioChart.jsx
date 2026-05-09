import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#111118',
        border: '1px solid #1e1e2e',
        borderRadius: '8px',
        padding: '10px 14px',
      }}>
        <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
        <p style={{ color: '#00d4aa', fontWeight: '600', fontSize: '14px' }}>
          ${payload[0].value.toFixed(2)}
        </p>
      </div>
    )
  }
  return null
}

export default function PortfolioChart({ holdings }) {
  if (!holdings || holdings.length === 0) return null

  // Generate chart data based on holdings
  const data = holdings.map(stock => ({
    name: stock.symbol,
    invested: stock.invested,
    value: stock.current_value,
    pnl: stock.profit_loss,
  }))

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-primary font-semibold">Portfolio Performance</h2>
          <p className="text-secondary text-xs mt-0.5">Current value vs invested amount</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6b7280" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="invested"
            stroke="#6b7280"
            strokeWidth={1.5}
            fill="url(#investedGradient)"
            strokeDasharray="4 4"
            name="Invested"
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00d4aa"
            strokeWidth={2}
            fill="url(#valueGradient)"
            name="Current Value"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-accent"></div>
          <span className="text-secondary text-xs">Current Value</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-secondary" style={{borderTop: '1.5px dashed #6b7280'}}></div>
          <span className="text-secondary text-xs">Invested</span>
        </div>
      </div>
    </div>
  )
}