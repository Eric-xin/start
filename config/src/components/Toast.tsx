import { useEffect } from 'react'

const C = {
  green: '#00c853',
  red: '#e53935',
  panel: '#0c1220',
  border: '#1e2d45',
  textBright: '#e2eaf8',
  mono: "'IBM Plex Mono', 'Courier New', monospace",
}

export interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: number) => void
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const borderColor = toast.type === 'success' ? C.green : C.red
  const textColor = toast.type === 'success' ? C.green : C.red

  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${borderColor}`,
        padding: '10px 16px',
        minWidth: 280,
        maxWidth: 400,
        pointerEvents: 'auto',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
      onClick={() => onRemove(toast.id)}
    >
      <span style={{ color: borderColor, fontSize: 14 }}>
        {toast.type === 'success' ? '✓' : '✗'}
      </span>
      <span
        style={{
          fontFamily: C.mono,
          fontSize: 11,
          color: textColor,
          letterSpacing: '0.05em',
        }}
      >
        {toast.message}
      </span>
    </div>
  )
}

let _toastId = 0
export function nextToastId() {
  return ++_toastId
}
