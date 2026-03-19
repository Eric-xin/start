import { useEffect, useState, useCallback } from 'react'
import { getPortfolios, updatePortfolio, PortfolioAdmin } from '../api'
import Drawer from '../components/Drawer'
import Toast, { ToastMessage, nextToastId } from '../components/Toast'

const C = {
  panel: '#0c1220',
  surface: '#111827',
  border: '#1e2d45',
  borderDim: '#162035',
  blue: '#0a6cf5',
  green: '#00c853',
  red: '#e53935',
  amber: '#ffa000',
  purple: '#8b5cf6',
  textBright: '#e2eaf8',
  textDim: '#8fa3bf',
  textMuted: '#4a6080',
  mono: "'IBM Plex Mono', 'Courier New', monospace",
}

function fmt(n: number) {
  return `$${n.toLocaleString()}`
}

const thStyle = {
  padding: '10px 16px',
  fontFamily: C.mono,
  fontSize: 10,
  color: C.textMuted,
  letterSpacing: '0.15em',
  textAlign: 'left' as const,
  fontWeight: 600,
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap' as const,
}

const tdStyle = (even: boolean) => ({
  padding: '10px 16px',
  fontFamily: C.mono,
  fontSize: 12,
  color: C.textBright,
  background: even ? C.panel : C.surface,
  borderBottom: `1px solid ${C.borderDim}`,
  verticalAlign: 'middle' as const,
  whiteSpace: 'nowrap' as const,
})

const inputStyle = (focused: boolean) => ({
  width: '100%',
  padding: '8px 12px',
  background: '#080d18',
  border: `1px solid ${focused ? C.blue : C.border}`,
  color: C.textBright,
  fontFamily: C.mono,
  fontSize: 12,
  outline: 'none',
  boxShadow: focused ? `0 0 0 2px rgba(10,108,245,0.15)` : 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
})

const labelStyle = {
  display: 'block',
  fontFamily: C.mono,
  fontSize: 10,
  color: C.textMuted,
  letterSpacing: '0.15em',
  marginBottom: 6,
  textTransform: 'uppercase' as const,
}

export default function Portfolios() {
  const [portfolios, setPortfolios] = useState<PortfolioAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<PortfolioAdmin | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [saving, setSaving] = useState(false)

  const [editCapital, setEditCapital] = useState('')
  const [editNetWorth, setEditNetWorth] = useState('')
  const [editStage, setEditStage] = useState('1')
  const [editRank, setEditRank] = useState('1')
  const [editStreak, setEditStreak] = useState('')

  const [capitalFocus, setCapitalFocus] = useState(false)
  const [netWorthFocus, setNetWorthFocus] = useState(false)
  const [stageFocus, setStageFocus] = useState(false)
  const [rankFocus, setRankFocus] = useState(false)
  const [streakFocus, setStreakFocus] = useState(false)

  useEffect(() => {
    getPortfolios()
      .then(setPortfolios)
      .catch(() => setError('Failed to load portfolios.'))
      .finally(() => setLoading(false))
  }, [])

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    setToasts((prev) => [...prev, { id: nextToastId(), message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  function openEdit(p: PortfolioAdmin) {
    setSelected(p)
    setEditCapital(String(p.capital))
    setEditNetWorth(String(p.net_worth))
    setEditStage(String(p.stage))
    setEditRank(String(p.investor_rank))
    setEditStreak(String(p.income_streak))
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setSelected(null)
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await updatePortfolio(selected.user_id, {
        capital: parseFloat(editCapital),
        net_worth: parseFloat(editNetWorth),
        stage: parseInt(editStage),
        investor_rank: parseInt(editRank),
        income_streak: parseInt(editStreak),
      })
      setPortfolios((prev) => prev.map((p) => (p.user_id === updated.user_id ? updated : p)))
      addToast('Portfolio updated successfully.', 'success')
      closeDrawer()
    } catch {
      addToast('Failed to update portfolio.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ fontFamily: C.mono, color: C.textDim, fontSize: 13, letterSpacing: '0.1em' }}>
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
        }}
      >
        ERROR: {error}
      </div>
    )
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.textDim, letterSpacing: '0.1em' }}>
            {portfolios.length} PORTFOLIOS FOUND
          </span>
        </div>

        {portfolios.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: C.mono,
              fontSize: 12,
              color: C.textMuted,
              letterSpacing: '0.1em',
            }}
          >
            NO PORTFOLIOS FOUND
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    'USER',
                    'CAPITAL',
                    'NET WORTH',
                    'PEAK',
                    'STAGE',
                    'RANK',
                    'CARDS PLAYED',
                    'STREAK',
                    'EDIT',
                  ].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolios.map((p, i) => {
                  const even = i % 2 === 0
                  return (
                    <tr key={p.user_id}>
                      <td style={tdStyle(even)}>
                        <div>{p.username}</div>
                        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{p.email}</div>
                      </td>
                      <td style={{ ...tdStyle(even), color: C.green }}>{fmt(p.capital)}</td>
                      <td style={{ ...tdStyle(even), color: C.textBright }}>{fmt(p.net_worth)}</td>
                      <td style={{ ...tdStyle(even), color: C.textDim }}>{fmt(p.peak_net_worth)}</td>
                      <td style={tdStyle(even)}>
                        <span
                          style={{
                            padding: '3px 8px',
                            background: 'rgba(10,108,245,0.15)',
                            border: `1px solid rgba(10,108,245,0.3)`,
                            color: C.blue,
                            fontFamily: C.mono,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                          }}
                        >
                          S{p.stage}
                        </span>
                      </td>
                      <td style={tdStyle(even)}>
                        <span
                          style={{
                            padding: '3px 8px',
                            background: 'rgba(139,92,246,0.15)',
                            border: `1px solid rgba(139,92,246,0.3)`,
                            color: C.purple,
                            fontFamily: C.mono,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                          }}
                        >
                          R{p.investor_rank}
                        </span>
                      </td>
                      <td style={{ ...tdStyle(even), color: C.textDim }}>
                        {p.total_cards_played.toLocaleString()}
                      </td>
                      <td style={{ ...tdStyle(even), color: C.amber }}>{p.income_streak}</td>
                      <td style={tdStyle(even)}>
                        <button
                          onClick={() => openEdit(p)}
                          style={{
                            padding: '5px 14px',
                            background: 'transparent',
                            border: `1px solid ${C.blue}`,
                            color: C.blue,
                            fontFamily: C.mono,
                            fontSize: 10,
                            letterSpacing: '0.1em',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          EDIT
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={closeDrawer} width={380}>
        {selected && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 24,
                paddingBottom: 20,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.textBright,
                    letterSpacing: '0.08em',
                    marginBottom: 4,
                  }}
                >
                  EDIT PORTFOLIO
                </div>
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: 11,
                    color: C.textMuted,
                  }}
                >
                  {selected.username}
                </div>
              </div>
              <button
                onClick={closeDrawer}
                style={{
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  color: C.textDim,
                  fontFamily: C.mono,
                  fontSize: 10,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                }}
              >
                CLOSE ✕
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>EMAIL</div>
              <div
                style={{
                  fontFamily: C.mono,
                  fontSize: 11,
                  color: C.textDim,
                  padding: '8px 12px',
                  background: C.surface,
                  border: `1px solid ${C.borderDim}`,
                }}
              >
                {selected.email}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>CAPITAL ($)</label>
                <input
                  type="number"
                  value={editCapital}
                  onChange={(e) => setEditCapital(e.target.value)}
                  onFocus={() => setCapitalFocus(true)}
                  onBlur={() => setCapitalFocus(false)}
                  style={inputStyle(capitalFocus)}
                />
              </div>

              <div>
                <label style={labelStyle}>NET WORTH ($)</label>
                <input
                  type="number"
                  value={editNetWorth}
                  onChange={(e) => setEditNetWorth(e.target.value)}
                  onFocus={() => setNetWorthFocus(true)}
                  onBlur={() => setNetWorthFocus(false)}
                  style={inputStyle(netWorthFocus)}
                />
              </div>

              <div>
                <label style={labelStyle}>STAGE (1–5)</label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value)}
                  onFocus={() => setStageFocus(true)}
                  onBlur={() => setStageFocus(false)}
                  style={{
                    ...inputStyle(stageFocus),
                    appearance: 'none' as const,
                    cursor: 'pointer',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <option key={s} value={s}>
                      Stage {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>INVESTOR RANK (1–4)</label>
                <select
                  value={editRank}
                  onChange={(e) => setEditRank(e.target.value)}
                  onFocus={() => setRankFocus(true)}
                  onBlur={() => setRankFocus(false)}
                  style={{
                    ...inputStyle(rankFocus),
                    appearance: 'none' as const,
                    cursor: 'pointer',
                  }}
                >
                  {[1, 2, 3, 4].map((r) => (
                    <option key={r} value={r}>
                      Rank {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>INCOME STREAK</label>
                <input
                  type="number"
                  value={editStreak}
                  onChange={(e) => setEditStreak(e.target.value)}
                  onFocus={() => setStreakFocus(true)}
                  onBlur={() => setStreakFocus(false)}
                  style={inputStyle(streakFocus)}
                />
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: saving ? '#0858c8' : C.blue,
                  border: 'none',
                  color: '#fff',
                  fontFamily: C.mono,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
              <button
                onClick={closeDrawer}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  color: C.textDim,
                  fontFamily: C.mono,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  )
}
