import { useEffect, useState } from 'react'
import { getStats, StatsResponse } from '../api'

const C = {
  panel: '#0c1220',
  surface: '#111827',
  border: '#1e2d45',
  borderDim: '#162035',
  blue: '#0a6cf5',
  green: '#00c853',
  amber: '#ffa000',
  textBright: '#e2eaf8',
  textDim: '#8fa3bf',
  textMuted: '#4a6080',
  mono: "'IBM Plex Mono', 'Courier New', monospace",
}

interface StatCardProps {
  label: string
  value: string
  subtext: string
  accent?: string
}

function StatCard({ label, value, subtext, accent = C.blue }: StatCardProps) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderTop: `2px solid ${accent}`,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 10,
          color: C.textMuted,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 28,
          fontWeight: 700,
          color: C.textBright,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 11,
          color: C.textDim,
          letterSpacing: '0.05em',
        }}
      >
        {subtext}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError('Failed to load system statistics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div
        style={{
          fontFamily: C.mono,
          color: C.textDim,
          fontSize: 13,
          letterSpacing: '0.1em',
          padding: 20,
        }}
      >
        LOADING...
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          background: 'rgba(229,57,53,0.1)',
          border: '1px solid #e53935',
          borderLeft: '3px solid #e53935',
          color: '#e53935',
          fontFamily: C.mono,
          fontSize: 12,
          padding: '12px 16px',
          letterSpacing: '0.05em',
        }}
      >
        ERROR: {error}
      </div>
    )
  }

  const s = stats!

  return (
    <div>
      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="REGISTERED USERS"
          value={s.total_users.toLocaleString()}
          subtext="registered accounts"
          accent={C.blue}
        />
        <StatCard
          label="ACTIVE PORTFOLIOS"
          value={s.total_portfolios.toLocaleString()}
          subtext="continuous play users"
          accent={C.green}
        />
        <StatCard
          label="TOTAL CARDS PLAYED"
          value={s.total_cards_played.toLocaleString()}
          subtext="decisions recorded"
          accent={C.amber}
        />
        <StatCard
          label="TOTAL CAPITAL"
          value={`$${s.total_capital.toLocaleString()}`}
          subtext="across all portfolios"
          accent="#8b5cf6"
        />
        <StatCard
          label="ACTIVE CARDS"
          value={s.active_cards.toLocaleString()}
          subtext="in card pool"
          accent={C.blue}
        />
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: `1px solid ${C.borderDim}`,
          marginBottom: 24,
        }}
      />

      {/* Status panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* System status */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 10,
              color: C.textMuted,
              letterSpacing: '0.18em',
              marginBottom: 16,
            }}
          >
            SYSTEM STATUS
          </div>
          {[
            { label: 'API SERVER', status: 'NOMINAL' },
            { label: 'DATABASE', status: 'NOMINAL' },
            { label: 'AUTH SERVICE', status: 'NOMINAL' },
            { label: 'EMAIL SERVICE', status: 'NOMINAL' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: `1px solid ${C.borderDim}`,
              }}
            >
              <span
                style={{
                  fontFamily: C.mono,
                  fontSize: 11,
                  color: C.textDim,
                  letterSpacing: '0.06em',
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: C.mono,
                  fontSize: 10,
                  color: C.green,
                  letterSpacing: '0.1em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: C.green,
                    display: 'inline-block',
                  }}
                />
                {item.status}
              </span>
            </div>
          ))}
        </div>

        {/* Activity log */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 10,
              color: C.textMuted,
              letterSpacing: '0.18em',
              marginBottom: 16,
            }}
          >
            RECENT ACTIVITY
          </div>
          {[
            'System operational — all services nominal',
            'Admin panel initialized successfully',
            'Database connection established',
            'Auth service running',
            'Card pool loaded and active',
          ].map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                padding: '6px 0',
                borderBottom: i < 4 ? `1px solid ${C.borderDim}` : 'none',
              }}
            >
              <span
                style={{
                  fontFamily: C.mono,
                  fontSize: 10,
                  color: i === 0 ? C.green : C.textMuted,
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {i === 0 ? '●' : '·'}
              </span>
              <span
                style={{
                  fontFamily: C.mono,
                  fontSize: 11,
                  color: i === 0 ? C.green : C.textDim,
                  letterSpacing: '0.04em',
                }}
              >
                {msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
