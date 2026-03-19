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
  blueDim: '#0858c8',
  green: '#00c853',
  amber: '#ffa000',
  textBright: '#e2eaf8',
  textDim: '#8fa3bf',
  textMuted: '#4a6080',
  mono: "'IBM Plex Mono', 'Courier New', monospace",
}

const SMTP_KEYS = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from', 'smtp_from_name', 'email_backend']

const SMTP_LABELS: Record<string, string> = {
  smtp_host: 'SMTP HOST',
  smtp_port: 'SMTP PORT',
  smtp_user: 'SMTP USERNAME',
  smtp_password: 'SMTP PASSWORD',
  smtp_from: 'FROM ADDRESS',
  smtp_from_name: 'FROM NAME',
  email_backend: 'EMAIL BACKEND',
}

const SMTP_PLACEHOLDERS: Record<string, string> = {
  smtp_host: 'smtp.example.com',
  smtp_port: '587',
  smtp_user: 'noreply@example.com',
  smtp_password: '••••••••••••',
  smtp_from: 'noreply@cardecon.app',
  smtp_from_name: 'CardEcon',
  email_backend: 'console',
}

const inputStyle = (focused: boolean) => ({
  width: '100%',
  padding: '10px 14px',
  background: C.bg,
  border: `1px solid ${focused ? C.blue : C.border}`,
  color: C.textBright,
  fontFamily: C.mono,
  fontSize: 13,
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

interface FocusState {
  [key: string]: boolean
}

export default function Settings() {
  const [config, setConfig] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [smtpValues, setSmtpValues] = useState<Record<string, string>>({})
  const [originalSmtpValues, setOriginalSmtpValues] = useState<Record<string, string>>({})
  const [focused, setFocused] = useState<FocusState>({})
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    getConfig()
      .then((data) => {
        setConfig(data)
        const vals: Record<string, string> = {}
        for (const key of SMTP_KEYS) {
          const entry = data[key]
          const raw = entry && typeof entry === 'object' && 'value' in entry ? entry.value : entry
          vals[key] = raw !== undefined && raw !== null ? String(raw) : ''
        }
        setSmtpValues(vals)
        setOriginalSmtpValues({ ...vals })
      })
      .catch(() => setError('Failed to load configuration.'))
      .finally(() => setLoading(false))
  }, [])

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    setToasts((prev) => [...prev, { id: nextToastId(), message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  async function handleSaveSMTP() {
    setSaving(true)
    const errors: string[] = []

    for (const key of SMTP_KEYS) {
      if (smtpValues[key] !== originalSmtpValues[key]) {
        try {
          let value: any = smtpValues[key]
          if (key === 'smtp_port') {
            value = parseInt(value) || value
          }
          await updateConfig(key, value)
          setOriginalSmtpValues((prev) => ({ ...prev, [key]: smtpValues[key] }))
        } catch {
          errors.push(key)
        }
      }
    }

    setSaving(false)

    if (errors.length > 0) {
      addToast(`Failed to update: ${errors.join(', ')}`, 'error')
    } else {
      addToast('SMTP settings saved successfully.', 'success')
    }
  }

  function setFocusedKey(key: string, val: boolean) {
    setFocused((prev) => ({ ...prev, [key]: val }))
  }

  function renderSmtpField(key: string) {
    const isPassword = key === 'smtp_password'
    const isSelect = key === 'email_backend'
    const isFocused = focused[key] || false

    if (isSelect) {
      return (
        <div key={key} style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{SMTP_LABELS[key]}</label>
          <select
            value={smtpValues[key] || ''}
            onChange={(e) => setSmtpValues((prev) => ({ ...prev, [key]: e.target.value }))}
            onFocus={() => setFocusedKey(key, true)}
            onBlur={() => setFocusedKey(key, false)}
            style={{
              ...inputStyle(isFocused),
              appearance: 'none' as const,
              cursor: 'pointer',
            }}
          >
            <option value="console">console</option>
            <option value="smtp">smtp</option>
          </select>
        </div>
      )
    }

    return (
      <div key={key} style={{ marginBottom: 20 }}>
        <label style={labelStyle}>{SMTP_LABELS[key]}</label>
        <input
          type={isPassword ? 'password' : key === 'smtp_port' ? 'number' : 'text'}
          value={smtpValues[key] || ''}
          onChange={(e) => setSmtpValues((prev) => ({ ...prev, [key]: e.target.value }))}
          onFocus={() => setFocusedKey(key, true)}
          onBlur={() => setFocusedKey(key, false)}
          placeholder={SMTP_PLACEHOLDERS[key]}
          style={inputStyle(isFocused)}
          autoComplete={isPassword ? 'off' : undefined}
        />
      </div>
    )
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
        {/* SMTP Configuration */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: C.mono,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.textBright,
                  letterSpacing: '0.12em',
                  marginBottom: 2,
                }}
              >
                SMTP CONFIGURATION
              </div>
              <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textMuted, letterSpacing: '0.08em' }}>
                Email delivery settings
              </div>
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: smtpValues['email_backend'] === 'smtp' ? C.green : C.amber,
                boxShadow: `0 0 6px ${smtpValues['email_backend'] === 'smtp' ? C.green : C.amber}`,
              }}
            />
          </div>

          {/* Form */}
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              {renderSmtpField('smtp_host')}
              {renderSmtpField('smtp_port')}
              {renderSmtpField('smtp_user')}
              {renderSmtpField('smtp_password')}
              {renderSmtpField('smtp_from')}
              {renderSmtpField('smtp_from_name')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              {renderSmtpField('email_backend')}
              <div />
            </div>

            {/* Note */}
            <div
              style={{
                background: 'rgba(10,108,245,0.06)',
                border: `1px solid ${C.borderDim}`,
                borderLeft: `3px solid ${C.blue}`,
                padding: '10px 14px',
                marginBottom: 20,
                fontFamily: C.mono,
                fontSize: 11,
                color: C.textDim,
                lineHeight: 1.5,
                letterSpacing: '0.03em',
              }}
            >
              SMTP settings are persisted to database and override environment variables at runtime. Restart is not required.
            </div>

            <button
              onClick={handleSaveSMTP}
              disabled={saving}
              style={{
                padding: '11px 28px',
                background: saving ? C.blueDim : C.blue,
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
              {saving ? 'SAVING...' : 'SAVE SMTP SETTINGS'}
            </button>
          </div>
        </div>

        {/* App Configuration */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                fontFamily: C.mono,
                fontSize: 12,
                fontWeight: 600,
                color: C.textBright,
                letterSpacing: '0.12em',
                marginBottom: 2,
              }}
            >
              APPLICATION CONFIGURATION
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textMuted, letterSpacing: '0.08em' }}>
              General application settings
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>FRONTEND URL</label>
              <input
                type="text"
                value={config['app_frontend_url'] || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setConfig((prev) => ({ ...prev, app_frontend_url: val }))
                }}
                onBlur={(e) => {
                  setFocusedKey('app_frontend_url', false)
                  const val = e.target.value
                  updateConfig('app_frontend_url', val)
                    .then(() => addToast('Frontend URL updated.', 'success'))
                    .catch(() => addToast('Failed to update frontend URL.', 'error'))
                }}
                onFocus={() => setFocusedKey('app_frontend_url', true)}
                placeholder="https://cardecon.app"
                style={inputStyle(focused['app_frontend_url'] || false)}
              />
              <div
                style={{
                  fontFamily: C.mono,
                  fontSize: 10,
                  color: C.textMuted,
                  marginTop: 4,
                  letterSpacing: '0.06em',
                }}
              >
                Saved on blur
              </div>
            </div>

            <div>
              <div style={labelStyle}>ENVIRONMENT</div>
              <div
                style={{
                  padding: '10px 14px',
                  background: C.surface,
                  border: `1px solid ${C.borderDim}`,
                  fontFamily: C.mono,
                  fontSize: 13,
                  color: config['environment'] === 'production' ? C.green : C.amber,
                  letterSpacing: '0.08em',
                }}
              >
                {config['environment'] || 'development'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
