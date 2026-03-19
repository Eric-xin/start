import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const C = {
  bg: '#080d18',
  panel: '#0c1220',
  surface: '#111827',
  border: '#1e2d45',
  borderDim: '#162035',
  blue: '#0a6cf5',
  blueDim: '#0858c8',
  green: '#00c853',
  red: '#e53935',
  amber: '#ffa000',
  purple: '#8b5cf6',
  textBright: '#e2eaf8',
  textDim: '#8fa3bf',
  textMuted: '#4a6080',
  mono: "'IBM Plex Mono', 'Courier New', monospace",
}

const navItems = [
  { icon: '⬛', label: 'DASHBOARD', path: '/dashboard' },
  { icon: '👤', label: 'USERS', path: '/users' },
  { icon: '💰', label: 'PORTFOLIOS', path: '/portfolios' },
  { icon: '🃏', label: 'DECKS', path: '/decks' },
  { icon: '📋', label: 'CARDS', path: '/cards' },
  { icon: '⚙', label: 'CONFIG', path: '/config' },
  { icon: '📡', label: 'SETTINGS', path: '/settings' },
]

interface LayoutProps {
  title: string
  children: React.ReactNode
}

export default function Layout({ title, children }: LayoutProps) {
  const navigate = useNavigate()
  const [clock, setClock] = useState('')
  const username = localStorage.getItem('admin_username') || 'ADMIN'

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const h = now.getHours().toString().padStart(2, '0')
      const m = now.getMinutes().toString().padStart(2, '0')
      const s = now.getSeconds().toString().padStart(2, '0')
      setClock(`${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  function handleLogout() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_username')
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          minWidth: 220,
          background: C.panel,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.borderDim}` }}>
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 18,
              fontWeight: 700,
              color: C.blue,
              letterSpacing: '0.1em',
            }}
          >
            CARDECON
          </div>
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 10,
              color: C.textMuted,
              letterSpacing: '0.2em',
              marginTop: 2,
            }}
          >
            ADMIN TERMINAL
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 20px',
                textDecoration: 'none',
                fontFamily: C.mono,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.08em',
                color: isActive ? C.blue : C.textDim,
                background: isActive ? 'rgba(10,108,245,0.08)' : 'transparent',
                borderLeft: isActive ? `3px solid ${C.blue}` : '3px solid transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <span style={{ fontSize: 13 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom user section */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: `1px solid ${C.borderDim}`,
          }}
        >
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 10,
              color: C.textMuted,
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}
          >
            LOGGED IN AS
          </div>
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 12,
              color: C.textBright,
              marginBottom: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {username}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '7px 12px',
              background: 'transparent',
              border: `1px solid ${C.red}`,
              color: C.red,
              fontFamily: C.mono,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.12em',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header
          style={{
            height: 52,
            minHeight: 52,
            background: C.panel,
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 13,
              fontWeight: 600,
              color: C.textBright,
              letterSpacing: '0.1em',
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: C.green,
                boxShadow: `0 0 6px ${C.green}`,
              }}
            />
            <div
              style={{
                fontFamily: C.mono,
                fontSize: 13,
                color: C.textDim,
                letterSpacing: '0.05em',
              }}
            >
              {clock}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{children}</main>
      </div>
    </div>
  )
}
