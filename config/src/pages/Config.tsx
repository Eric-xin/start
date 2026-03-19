import { useEffect, useState, useCallback } from 'react'
import { getConfig, updateConfig } from '../api'
import Toast, { ToastMessage, nextToastId } from '../components/Toast'

const C = {
  bg: '#080d18',
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

const KNOWN_KEYS: Record<string, string> = {
  persona_update_rates: 'Weights for persona vector updates',
  score_weights: 'Card scoring formula weights by type',
  stage_progression_threshold: 'Progress threshold to advance stage',
  investor_rank_thresholds: 'Capital+stage thresholds for rank-up',
  smtp_host: 'SMTP server hostname',
  smtp_port: 'SMTP server port',
  smtp_user: 'SMTP authentication username',
  smtp_password: 'SMTP authentication password',
  smtp_from: 'Sender email address',
  smtp_from_name: 'Sender display name',
  email_backend: 'Email backend: console or smtp',
  app_frontend_url: 'Frontend application URL',
}

const inputStyle = (focused: boolean, error?: boolean) => ({
  width: '100%',
  padding: '8px 12px',
  background: C.bg,
  border: `1px solid ${error ? C.red : focused ? C.blue : C.border}`,
  color: C.textBright,
  fontFamily: C.mono,
  fontSize: 12,
  outline: 'none',
  boxShadow: error
    ? `0 0 0 2px rgba(229,57,53,0.15)`
    : focused
    ? `0 0 0 2px rgba(10,108,245,0.15)`
    : 'none',
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

interface ConfigEntry {
  key: string
  value: any
  description?: string
}

interface RowEditorProps {
  entry: ConfigEntry
  onSave: (key: string, value: any, description: string) => void
  onCancel: () => void
  saving: boolean
}

function RowEditor({ entry, onSave, onCancel, saving }: RowEditorProps) {
  const [valueStr, setValueStr] = useState(() => {
    try {
      return JSON.stringify(entry.value, null, 2)
    } catch {
      return String(entry.value)
    }
  })
  const [description, setDescription] = useState(entry.description || KNOWN_KEYS[entry.key] || '')
  const [valueFocused, setValueFocused] = useState(false)
  const [descFocused, setDescFocused] = useState(false)
  const [parseError, setParseError] = useState(false)

  function handleValueChange(v: string) {
    setValueStr(v)
    try {
      JSON.parse(v)
      setParseError(false)
    } catch {
      setParseError(v.trim() !== '' && !/^"[^"]*"$/.test(v.trim()))
    }
  }

  function handleSave() {
    let parsed: any
    try {
      parsed = JSON.parse(valueStr)
    } catch {
      parsed = valueStr
    }
    onSave(entry.key, parsed, description)
  }

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.blue}`,
        borderTop: 'none',
        padding: '16px 20px',
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>VALUE (JSON)</label>
        <textarea
          value={valueStr}
          onChange={(e) => handleValueChange(e.target.value)}
          onFocus={() => setValueFocused(true)}
          onBlur={() => setValueFocused(false)}
          style={{
            ...inputStyle(valueFocused, parseError),
            minHeight: 80,
            resize: 'vertical' as const,
            fontFamily: C.mono,
            fontSize: 12,
          }}
        />
        {parseError && (
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 10,
              color: C.red,
              marginTop: 4,
              letterSpacing: '0.08em',
            }}
          >
            INVALID JSON — will be saved as string
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>DESCRIPTION</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => setDescFocused(true)}
          onBlur={() => setDescFocused(false)}
          style={inputStyle(descFocused)}
          placeholder="Config key description..."
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 20px',
            background: saving ? '#0858c8' : C.blue,
            border: 'none',
            color: '#fff',
            fontFamily: C.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.12em',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 20px',
            background: 'transparent',
            border: `1px solid ${C.border}`,
            color: C.textDim,
            fontFamily: C.mono,
            fontSize: 10,
            letterSpacing: '0.1em',
            cursor: 'pointer',
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  )
}

interface AddKeyFormProps {
  onAdd: (key: string, value: any, description: string) => void
  onCancel: () => void
  saving: boolean
}

function AddKeyForm({ onAdd, onCancel, saving }: AddKeyFormProps) {
  const [key, setKey] = useState('')
  const [valueStr, setValueStr] = useState('""')
  const [description, setDescription] = useState('')
  const [parseError, setParseError] = useState(false)
  const [keyFocused, setKeyFocused] = useState(false)
  const [valueFocused, setValueFocused] = useState(false)
  const [descFocused, setDescFocused] = useState(false)

  function handleValueChange(v: string) {
    setValueStr(v)
    try {
      JSON.parse(v)
      setParseError(false)
    } catch {
      setParseError(v.trim() !== '')
    }
  }

  function handleAdd() {
    let parsed: any
    try {
      parsed = JSON.parse(valueStr)
    } catch {
      parsed = valueStr
    }
    onAdd(key, parsed, description)
  }

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.blue}`,
        padding: '16px 20px',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 10,
          color: C.blue,
          letterSpacing: '0.18em',
          marginBottom: 16,
        }}
      >
        ADD NEW CONFIG KEY
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0 16px', marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>KEY</label>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onFocus={() => setKeyFocused(true)}
            onBlur={() => setKeyFocused(false)}
            style={inputStyle(keyFocused)}
            placeholder="config_key_name"
          />
        </div>
        <div>
          <label style={labelStyle}>DESCRIPTION</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            style={inputStyle(descFocused)}
            placeholder="What this config key does..."
          />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>VALUE (JSON)</label>
        <textarea
          value={valueStr}
          onChange={(e) => handleValueChange(e.target.value)}
          onFocus={() => setValueFocused(true)}
          onBlur={() => setValueFocused(false)}
          style={{
            ...inputStyle(valueFocused, parseError),
            minHeight: 60,
            resize: 'vertical' as const,
            fontFamily: C.mono,
          }}
        />
        {parseError && (
          <div style={{ fontFamily: C.mono, fontSize: 10, color: C.red, marginTop: 4 }}>
            INVALID JSON
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleAdd}
          disabled={saving || !key.trim()}
          style={{
            padding: '8px 20px',
            background: saving || !key.trim() ? '#0858c8' : C.blue,
            border: 'none',
            color: '#fff',
            fontFamily: C.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.12em',
            cursor: saving || !key.trim() ? 'not-allowed' : 'pointer',
            opacity: saving || !key.trim() ? 0.6 : 1,
          }}
        >
          {saving ? 'ADDING...' : 'ADD KEY'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 20px',
            background: 'transparent',
            border: `1px solid ${C.border}`,
            color: C.textDim,
            fontFamily: C.mono,
            fontSize: 10,
            letterSpacing: '0.1em',
            cursor: 'pointer',
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  )
}

export default function Config() {
  const [config, setConfig] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(() => setError('Failed to load configuration.'))
      .finally(() => setLoading(false))
  }, [])

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    setToasts((prev) => [...prev, { id: nextToastId(), message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  async function handleSave(key: string, value: any, description: string) {
    setSaving(true)
    try {
      await updateConfig(key, value, description)
      setConfig((prev) => ({ ...prev, [key]: value }))
      addToast(`Config key "${key}" updated.`, 'success')
      setEditingKey(null)
    } catch {
      addToast(`Failed to update "${key}".`, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAdd(key: string, value: any, description: string) {
    setSaving(true)
    try {
      await updateConfig(key, value, description)
      setConfig((prev) => ({ ...prev, [key]: value }))
      addToast(`Config key "${key}" added.`, 'success')
      setShowAddForm(false)
    } catch {
      addToast(`Failed to add "${key}".`, 'error')
    } finally {
      setSaving(false)
    }
  }

  function formatValue(value: any): string {
    try {
      return JSON.stringify(value, null, 0)
    } catch {
      return String(value)
    }
  }

  const entries: ConfigEntry[] = Object.entries(config).map(([key, entry]: [string, any]) => ({
    key,
    value: entry && typeof entry === 'object' && 'value' in entry ? entry.value : entry,
    description: (entry && typeof entry === 'object' && entry.description) || KNOWN_KEYS[key],
  }))

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

      {/* Header */}
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}
      >
        <button
          onClick={() => {
            setShowAddForm(true)
            setEditingKey(null)
          }}
          style={{
            padding: '9px 20px',
            background: C.blue,
            border: 'none',
            color: '#fff',
            fontFamily: C.mono,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            cursor: 'pointer',
          }}
        >
          + ADD KEY
        </button>
      </div>

      {showAddForm && (
        <AddKeyForm
          onAdd={handleAdd}
          onCancel={() => setShowAddForm(false)}
          saving={saving}
        />
      )}

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr 220px 80px',
            padding: '10px 20px',
            borderBottom: `1px solid ${C.border}`,
            gap: 16,
          }}
        >
          {['KEY', 'VALUE', 'DESCRIPTION', 'EDIT'].map((h) => (
            <div
              key={h}
              style={{
                fontFamily: C.mono,
                fontSize: 10,
                color: C.textMuted,
                letterSpacing: '0.15em',
                fontWeight: 600,
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {entries.length === 0 ? (
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
            NO CONFIG KEYS FOUND
          </div>
        ) : (
          entries.map((entry, i) => (
            <div key={entry.key}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 1fr 220px 80px',
                  padding: '12px 20px',
                  gap: 16,
                  background: i % 2 === 0 ? C.panel : C.surface,
                  borderBottom: `1px solid ${C.borderDim}`,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: 12,
                    color: C.blue,
                    letterSpacing: '0.04em',
                    wordBreak: 'break-all' as const,
                  }}
                >
                  {entry.key}
                </div>
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: 11,
                    color: C.textDim,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 400,
                  }}
                  title={formatValue(entry.value)}
                >
                  {formatValue(entry.value)}
                </div>
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: 11,
                    color: C.textMuted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.description || '—'}
                </div>
                <div>
                  <button
                    onClick={() =>
                      setEditingKey(editingKey === entry.key ? null : entry.key)
                    }
                    style={{
                      padding: '5px 14px',
                      background: 'transparent',
                      border: `1px solid ${editingKey === entry.key ? C.amber : C.blue}`,
                      color: editingKey === entry.key ? C.amber : C.blue,
                      fontFamily: C.mono,
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {editingKey === entry.key ? 'CLOSE' : 'EDIT'}
                  </button>
                </div>
              </div>

              {editingKey === entry.key && (
                <RowEditor
                  entry={entry}
                  onSave={handleSave}
                  onCancel={() => setEditingKey(null)}
                  saving={saving}
                />
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}
