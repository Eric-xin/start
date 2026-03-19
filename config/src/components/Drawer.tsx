import React from 'react'

const C = {
  panel: '#0c1220',
  border: '#1e2d45',
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  width?: number
  children: React.ReactNode
}

export default function Drawer({ open, onClose, width = 360, children }: DrawerProps) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8,13,24,0.7)',
          zIndex: 1000,
        }}
      />
      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width,
          background: C.panel,
          borderLeft: `1px solid ${C.border}`,
          zIndex: 1001,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </>
  )
}
