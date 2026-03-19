import { useEffect, useState, useCallback } from 'react'
import { getUsers, updateUser, UserAdmin } from '../api'
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

const selectStyle = (focused: boolean) => ({
  ...inputStyle(focused),
  cursor: 'pointer',
  appearance: 'none' as const,
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

export default function Users() {
  const [users, setUsers] = useState<UserAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<UserAdmin | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editRole, setEditRole] = useState('')
  const [editTier, setEditTier] = useState('')
  const [editVerified, setEditVerified] = useState(false)

  const [roleFocus, setRoleFocus] = useState(false)
  const [tierFocus, setTierFocus] = useState(false)

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }, [])

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    setToasts((prev) => [...prev, { id: nextToastId(), message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  function openEdit(user: UserAdmin) {
    setSelected(user)
    setEditRole(user.role)
    setEditTier(user.subscription_tier)
    setEditVerified(user.is_verified)
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
      const updated = await updateUser(selected.id, {
        role: editRole,
        subscription_tier: editTier,
        is_verified: editVerified,
      })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      addToast('User updated successfully.', 'success')
      closeDrawer()
    } catch {
      addToast('Failed to update user.', 'error')
    } finally {
      setSaving(false)
    }
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
  })

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

      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
        }}
      >
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
            {users.length} USERS FOUND
          </span>
        </div>

        {users.length === 0 ? (
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
            NO USERS FOUND
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['USERNAME', 'EMAIL', 'ROLE', 'SUBSCRIPTION', 'VERIFIED', 'JOINED', 'ACTIONS'].map(
                    (h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => {
                  const even = i % 2 === 0
                  return (
                    <tr key={user.id}>
                      <td style={tdStyle(even)}>{user.username}</td>
                      <td style={{ ...tdStyle(even), color: C.textDim }}>{user.email}</td>
                      <td style={tdStyle(even)}>
                        <span
                          style={{
                            fontFamily: C.mono,
                            fontSize: 10,
                            letterSpacing: '0.1em',
                            color: user.role === 'admin' ? C.amber : C.textDim,
                            fontWeight: user.role === 'admin' ? 700 : 400,
                          }}
                        >
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={tdStyle(even)}>
                        <span
                          style={{
                            fontFamily: C.mono,
                            fontSize: 10,
                            color:
                              user.subscription_tier === 'pro'
                                ? '#8b5cf6'
                                : user.subscription_tier === 'admin'
                                ? C.amber
                                : C.textDim,
                            letterSpacing: '0.08em',
                            fontWeight:
                              user.subscription_tier !== 'normal' ? 600 : 400,
                          }}
                        >
                          {user.subscription_tier.toUpperCase()}
                        </span>
                      </td>
                      <td style={tdStyle(even)}>
                        <span
                          style={{
                            color: user.is_verified ? C.green : C.red,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {user.is_verified ? '✓' : '✗'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle(even), color: C.textDim }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td style={tdStyle(even)}>
                        <button
                          onClick={() => openEdit(user)}
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

      <Drawer open={drawerOpen} onClose={closeDrawer} width={360}>
        {selected && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
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
                  EDIT USER
                </div>
                <div
                  style={{ fontFamily: C.mono, fontSize: 11, color: C.textMuted, letterSpacing: '0.05em' }}
                >
                  {selected.id.slice(0, 8)}...
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

            {/* Read-only info */}
            <div style={{ marginBottom: 20 }}>
              <div style={labelStyle}>USERNAME</div>
              <div
                style={{
                  fontFamily: C.mono,
                  fontSize: 13,
                  color: C.textBright,
                  padding: '8px 12px',
                  background: C.surface,
                  border: `1px solid ${C.borderDim}`,
                }}
              >
                {selected.username}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={labelStyle}>EMAIL</div>
              <div
                style={{
                  fontFamily: C.mono,
                  fontSize: 12,
                  color: C.textDim,
                  padding: '8px 12px',
                  background: C.surface,
                  border: `1px solid ${C.borderDim}`,
                  wordBreak: 'break-all' as const,
                }}
              >
                {selected.email}
              </div>
            </div>

            {/* Editable fields */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>ROLE</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                onFocus={() => setRoleFocus(true)}
                onBlur={() => setRoleFocus(false)}
                style={selectStyle(roleFocus)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>SUBSCRIPTION TIER</label>
              <select
                value={editTier}
                onChange={(e) => setEditTier(e.target.value)}
                onFocus={() => setTierFocus(true)}
                onBlur={() => setTierFocus(false)}
                style={selectStyle(tierFocus)}
              >
                <option value="normal">normal</option>
                <option value="pro">pro</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="checkbox"
                id="verified"
                checked={editVerified}
                onChange={(e) => setEditVerified(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: C.blue, cursor: 'pointer' }}
              />
              <label
                htmlFor="verified"
                style={{
                  fontFamily: C.mono,
                  fontSize: 12,
                  color: C.textDim,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                }}
              >
                EMAIL VERIFIED
              </label>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
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
