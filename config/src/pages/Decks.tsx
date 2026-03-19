import { useEffect, useState, useCallback } from 'react'
import { getProgress, updateProgress, ProgressAdmin } from '../api'
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
  textBright: '#e2eaf8',
  textDim: '#8fa3bf',
  textMuted: '#4a6080',
  mono: "'IBM Plex Mono', 'Courier New', monospace",
}

const ALL_STRATEGIES = [
  { id: 'savings', label: 'Savings' },
  { id: 'bonds', label: 'Bonds' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'index', label: 'Index Funds' },
  { id: 'alternatives', label: 'Alternatives' },
]

const ALL_DECKS = [
  { id: 'savings_core', label: 'Savings Core', strategy: 'savings' },
  { id: 'bonds_core', label: 'Bonds Core', strategy: 'bonds' },
  { id: 'stocks_core', label: 'Stocks Core', strategy: 'stocks' },
  { id: 'crypto_deck', label: 'Crypto Deck', strategy: 'alternatives' },
  { id: 'index_core', label: 'Index Core', strategy: 'index' },
  { id: 'real_estate_deck', label: 'Real Estate', strategy: 'alternatives' },
  { id: 'derivatives_deck', label: 'Derivatives', strategy: 'alternatives' },
]

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
})

interface EditState {
  unlocked_strategies: Set<string>
  enabled_strategies: Set<string>
  unlocked_decks: Set<string>
  enabled_decks: Set<string>
}

export default function Decks() {
  const [progress, setProgress] = useState<ProgressAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<ProgressAdmin | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [saving, setSaving] = useState(false)
  const [editState, setEditState] = useState<EditState>({
    unlocked_strategies: new Set(),
    enabled_strategies: new Set(),
    unlocked_decks: new Set(),
    enabled_decks: new Set(),
  })

  useEffect(() => {
    getProgress()
      .then(setProgress)
      .catch(() => setError('Failed to load progress data.'))
      .finally(() => setLoading(false))
  }, [])

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    setToasts((prev) => [...prev, { id: nextToastId(), message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  function openEdit(p: ProgressAdmin) {
    setSelected(p)
    setEditState({
      unlocked_strategies: new Set(p.unlocked_strategies),
      enabled_strategies: new Set(p.enabled_strategies),
      unlocked_decks: new Set(p.unlocked_decks),
      enabled_decks: new Set(p.enabled_decks),
    })
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setSelected(null)
  }

  function toggleSet(
    key: keyof EditState,
    id: string,
    checked: boolean
  ) {
    setEditState((prev) => {
      const next = new Set(prev[key])
      if (checked) next.add(id)
      else next.delete(id)
      return { ...prev, [key]: next }
    })
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await updateProgress(selected.user_id, {
        unlocked_strategies: Array.from(editState.unlocked_strategies),
        enabled_strategies: Array.from(editState.enabled_strategies),
        unlocked_decks: Array.from(editState.unlocked_decks),
        enabled_decks: Array.from(editState.enabled_decks),
      })
      setProgress((prev) => prev.map((p) => (p.user_id === updated.user_id ? updated : p)))
      addToast('Progress updated successfully.', 'success')
      closeDrawer()
    } catch {
      addToast('Failed to update progress.', 'error')
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
          }}
        >
          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.textDim, letterSpacing: '0.1em' }}>
            {progress.length} USERS TRACKED
          </span>
        </div>

        {progress.length === 0 ? (
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
            NO PROGRESS DATA FOUND
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['USER', 'STRATEGIES (ENABLED/TOTAL)', 'DECKS (ENABLED/TOTAL)', 'CARDS PLAYED', 'EDIT'].map(
                    (h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {progress.map((p, i) => {
                  const even = i % 2 === 0
                  return (
                    <tr key={p.user_id}>
                      <td style={tdStyle(even)}>
                        <div>{p.username}</div>
                        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{p.email}</div>
                      </td>
                      <td style={tdStyle(even)}>
                        <span style={{ color: C.green, fontWeight: 700 }}>
                          {p.enabled_strategies.length}
                        </span>
                        <span style={{ color: C.textMuted }}>/</span>
                        <span style={{ color: C.textDim }}>{p.unlocked_strategies.length}</span>
                        <span style={{ color: C.textMuted }}> unlocked</span>
                      </td>
                      <td style={tdStyle(even)}>
                        <span style={{ color: C.green, fontWeight: 700 }}>
                          {p.enabled_decks.length}
                        </span>
                        <span style={{ color: C.textMuted }}>/</span>
                        <span style={{ color: C.textDim }}>{p.unlocked_decks.length}</span>
                        <span style={{ color: C.textMuted }}> unlocked</span>
                      </td>
                      <td style={{ ...tdStyle(even), color: C.textDim }}>
                        {p.total_cards_played.toLocaleString()}
                      </td>
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

      <Drawer open={drawerOpen} onClose={closeDrawer} width={480}>
        {selected && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 20,
                paddingBottom: 16,
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
                  EDIT PROGRESS
                </div>
                <div style={{ fontFamily: C.mono, fontSize: 11, color: C.textMuted }}>
                  {selected.username} · {selected.email}
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

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Strategies section */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: 10,
                    color: C.blue,
                    letterSpacing: '0.2em',
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottom: `1px solid ${C.borderDim}`,
                  }}
                >
                  STRATEGIES
                </div>
                {ALL_STRATEGIES.map((strategy) => (
                  <div
                    key={strategy.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: C.surface,
                      border: `1px solid ${C.borderDim}`,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontFamily: C.mono, fontSize: 12, color: C.textBright }}>
                      {strategy.label}
                    </span>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          fontFamily: C.mono,
                          fontSize: 10,
                          color: C.textDim,
                          letterSpacing: '0.08em',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editState.unlocked_strategies.has(strategy.id)}
                          onChange={(e) =>
                            toggleSet('unlocked_strategies', strategy.id, e.target.checked)
                          }
                          style={{ accentColor: C.amber, width: 14, height: 14 }}
                        />
                        UNLOCKED
                      </label>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          fontFamily: C.mono,
                          fontSize: 10,
                          color: C.textDim,
                          letterSpacing: '0.08em',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editState.enabled_strategies.has(strategy.id)}
                          onChange={(e) =>
                            toggleSet('enabled_strategies', strategy.id, e.target.checked)
                          }
                          style={{ accentColor: C.green, width: 14, height: 14 }}
                        />
                        ENABLED
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Decks section */}
              <div>
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: 10,
                    color: C.blue,
                    letterSpacing: '0.2em',
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottom: `1px solid ${C.borderDim}`,
                  }}
                >
                  DECKS
                </div>
                {ALL_DECKS.map((deck) => (
                  <div
                    key={deck.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: C.surface,
                      border: `1px solid ${C.borderDim}`,
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: C.mono, fontSize: 12, color: C.textBright }}>
                        {deck.label}
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                        via {deck.strategy}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          fontFamily: C.mono,
                          fontSize: 10,
                          color: C.textDim,
                          letterSpacing: '0.08em',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editState.unlocked_decks.has(deck.id)}
                          onChange={(e) => toggleSet('unlocked_decks', deck.id, e.target.checked)}
                          style={{ accentColor: C.amber, width: 14, height: 14 }}
                        />
                        UNLOCKED
                      </label>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          fontFamily: C.mono,
                          fontSize: 10,
                          color: C.textDim,
                          letterSpacing: '0.08em',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editState.enabled_decks.has(deck.id)}
                          onChange={(e) => toggleSet('enabled_decks', deck.id, e.target.checked)}
                          style={{ accentColor: C.green, width: 14, height: 14 }}
                        />
                        ENABLED
                      </label>
                    </div>
                  </div>
                ))}
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
