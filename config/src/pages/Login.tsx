import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

const C = {
  bg: '#080d18',
  panel: '#0c1220',
  surface: '#111827',
  border: '#1e2d45',
  blue: '#0a6cf5',
  blueDim: '#0858c8',
  red: '#e53935',
  textBright: '#e2eaf8',
  textDim: '#8fa3bf',
  textMuted: '#4a6080',
  mono: "'IBM Plex Mono', 'Courier New', monospace",
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailFocus, setEmailFocus] = useState(false)
  const [passFocus, setPassFocus] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      localStorage.setItem('admin_token', data.access_token)
      const emailParts = email.split('@')
      localStorage.setItem('admin_username', emailParts[0].toUpperCase())
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Authentication failed. Check credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (focused: boolean) => ({
    width: '100%',
    padding: '10px 14px',
    background: C.surface,
    border: `1px solid ${focused ? C.blue : C.border}`,
    color: C.textBright,
    fontFamily: C.mono,
    fontSize: 13,
    outline: 'none',
    boxShadow: focused ? `0 0 0 2px rgba(10,108,245,0.15)` : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Decorative grid lines */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(10,108,245,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,108,245,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 28,
              fontWeight: 700,
              color: C.blue,
              letterSpacing: '0.15em',
              marginBottom: 8,
            }}
          >
            MARKETHAND ADMIN
          </div>
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 11,
              color: C.textMuted,
              letterSpacing: '0.2em',
            }}
          >
            SECURE ACCESS TERMINAL
          </div>
        </div>

        {/* Panel */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            padding: 32,
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 28,
              paddingBottom: 20,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {['#e53935', '#ffa000', '#00c853'].map((c) => (
              <div
                key={c}
                style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.8 }}
              />
            ))}
            <span
              style={{
                fontFamily: C.mono,
                fontSize: 10,
                color: C.textMuted,
                letterSpacing: '0.15em',
                marginLeft: 6,
              }}
            >
              AUTH MODULE v2.1
            </span>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(229,57,53,0.1)',
                border: `1px solid ${C.red}`,
                borderLeft: `3px solid ${C.red}`,
                color: C.red,
                fontFamily: C.mono,
                fontSize: 11,
                padding: '10px 14px',
                marginBottom: 20,
                letterSpacing: '0.04em',
              }}
            >
              ERROR: {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: C.mono,
                  fontSize: 10,
                  color: C.textMuted,
                  letterSpacing: '0.15em',
                  marginBottom: 8,
                }}
              >
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                required
                placeholder="admin@cardecon.app"
                style={inputStyle(emailFocus)}
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: C.mono,
                  fontSize: 10,
                  color: C.textMuted,
                  letterSpacing: '0.15em',
                  marginBottom: 8,
                }}
              >
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPassFocus(true)}
                onBlur={() => setPassFocus(false)}
                required
                placeholder="••••••••••••"
                style={inputStyle(passFocus)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: loading ? C.blueDim : C.blue,
                border: 'none',
                color: '#ffffff',
                fontFamily: C.mono,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.12em',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE →'}
            </button>
          </form>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: 16,
            fontFamily: C.mono,
            fontSize: 10,
            color: C.textMuted,
            letterSpacing: '0.1em',
          }}
        >
          MARKETHAND FINANCIAL EDUCATION PLATFORM
        </div>
      </div>
    </div>
  )
}
