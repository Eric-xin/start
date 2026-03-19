import React, { useEffect, useState, useCallback } from 'react'
import { getCards, createCard, updateCard, CardAdmin } from '../api'
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
  red: '#e53935',
  amber: '#ffa000',
  textBright: '#e2eaf8',
  textDim: '#8fa3bf',
  textMuted: '#4a6080',
  mono: "'IBM Plex Mono', 'Courier New', monospace",
}

const BAND_COLORS = [
  { value: 'blue', label: 'Blue', color: '#0a6cf5' },
  { value: 'green', label: 'Green', color: '#00c853' },
  { value: 'amber', label: 'Amber', color: '#ffa000' },
  { value: 'red', label: 'Red', color: '#e53935' },
  { value: 'purple', label: 'Purple', color: '#8b5cf6' },
  { value: 'teal', label: 'Teal', color: '#00bcd4' },
  { value: 'orange', label: 'Orange', color: '#ff6d00' },
  { value: 'grey', label: 'Grey', color: '#607d8b' },
]

const CARD_TYPES = ['education', 'event', 'action']

const emptyCard: Partial<CardAdmin> = {
  card_id: '',
  type: 'education',
  title: '',
  body: '',
  emoji: '',
  stage_min: 1,
  stage_max: 5,
  difficulty: 0.5,
  card_band_color: 'blue',
  is_active: true,
  left_choice: '',
  right_choice: '',
  left_lesson: '',
  right_lesson: '',
  topics: [],
  linked_traits: [],
  diagnostic_power: 0.5,
  alpha: 1.0,
}

function typeColor(type: string) {
  if (type === 'education') return C.blue
  if (type === 'event') return C.amber
  if (type === 'action') return C.green
  return C.textDim
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
  padding: '10px 14px',
  fontFamily: C.mono,
  fontSize: 12,
  color: C.textBright,
  background: even ? C.panel : C.surface,
  borderBottom: `1px solid ${C.borderDim}`,
  verticalAlign: 'middle' as const,
})

const inputStyle = (focused: boolean) => ({
  width: '100%',
  padding: '8px 12px',
  background: C.bg,
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

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

interface CardModalProps {
  card: Partial<CardAdmin> | null
  onClose: () => void
  onSave: (data: Partial<CardAdmin>) => void
  saving: boolean
}

function CardModal({ card, onClose, onSave, saving }: CardModalProps) {
  const [form, setForm] = useState<Partial<CardAdmin>>({ ...emptyCard, ...card })
  const [topicsStr, setTopicsStr] = useState((card?.topics || []).join(', '))
  const [traitsStr, setTraitsStr] = useState((card?.linked_traits || []).join(', '))
  const [focusedField, setFocusedField] = useState<string | null>(null)

  function fi(name: string) {
    return inputStyle(focusedField === name)
  }

  function fFocus(name: string) {
    return {
      onFocus: () => setFocusedField(name),
      onBlur: () => setFocusedField(null),
    }
  }

  function handleSubmit() {
    const data = {
      ...form,
      topics: topicsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      linked_traits: traitsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }
    onSave(data)
  }

  const isEdit = !!card?.id

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8,13,24,0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 620,
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 60px)',
          background: C.panel,
          border: `1px solid ${C.border}`,
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 13,
              fontWeight: 600,
              color: C.textBright,
              letterSpacing: '0.08em',
            }}
          >
            {isEdit ? 'EDIT CARD' : 'NEW CARD'}
          </div>
          <button
            onClick={onClose}
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

        {/* Scrollable form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <FormField label="Card ID">
              <input
                value={form.card_id || ''}
                onChange={(e) => setForm((f) => ({ ...f, card_id: e.target.value }))}
                style={fi('card_id')}
                placeholder="unique_card_id"
                {...fFocus('card_id')}
              />
            </FormField>

            <FormField label="Type">
              <select
                value={form.type || 'education'}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                style={{ ...fi('type'), appearance: 'none' as const, cursor: 'pointer' }}
                {...fFocus('type')}
              >
                {CARD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Emoji">
              <input
                value={form.emoji || ''}
                onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                style={fi('emoji')}
                placeholder="💡"
                {...fFocus('emoji')}
              />
            </FormField>

            <FormField label="Band Color">
              <select
                value={form.card_band_color || 'blue'}
                onChange={(e) => setForm((f) => ({ ...f, card_band_color: e.target.value }))}
                style={{ ...fi('color'), appearance: 'none' as const, cursor: 'pointer' }}
                {...fFocus('color')}
              >
                {BAND_COLORS.map((bc) => (
                  <option key={bc.value} value={bc.value}>
                    {bc.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Title">
            <input
              value={form.title || ''}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              style={fi('title')}
              placeholder="Card title..."
              {...fFocus('title')}
            />
          </FormField>

          <FormField label="Body">
            <textarea
              value={form.body || ''}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              style={{ ...fi('body'), minHeight: 80, resize: 'vertical' as const, fontFamily: C.mono }}
              placeholder="Card body text..."
              {...fFocus('body')}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 14px' }}>
            <FormField label="Stage Min">
              <input
                type="number"
                min={1}
                max={5}
                value={form.stage_min ?? 1}
                onChange={(e) => setForm((f) => ({ ...f, stage_min: parseInt(e.target.value) }))}
                style={fi('stage_min')}
                {...fFocus('stage_min')}
              />
            </FormField>

            <FormField label="Stage Max">
              <input
                type="number"
                min={1}
                max={5}
                value={form.stage_max ?? 5}
                onChange={(e) => setForm((f) => ({ ...f, stage_max: parseInt(e.target.value) }))}
                style={fi('stage_max')}
                {...fFocus('stage_max')}
              />
            </FormField>

            <FormField label="Alpha">
              <input
                type="number"
                step={0.01}
                value={form.alpha ?? 1}
                onChange={(e) => setForm((f) => ({ ...f, alpha: parseFloat(e.target.value) }))}
                style={fi('alpha')}
                {...fFocus('alpha')}
              />
            </FormField>

            <FormField label="Diag. Power">
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={form.diagnostic_power ?? 0.5}
                onChange={(e) =>
                  setForm((f) => ({ ...f, diagnostic_power: parseFloat(e.target.value) }))
                }
                style={fi('diag_power')}
                {...fFocus('diag_power')}
              />
            </FormField>
          </div>

          <FormField label={`Difficulty: ${(form.difficulty ?? 0.5).toFixed(2)}`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={form.difficulty ?? 0.5}
              onChange={(e) =>
                setForm((f) => ({ ...f, difficulty: parseFloat(e.target.value) }))
              }
              style={{ width: '100%', accentColor: C.blue, cursor: 'pointer' }}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <FormField label="Left Choice">
              <input
                value={form.left_choice || ''}
                onChange={(e) => setForm((f) => ({ ...f, left_choice: e.target.value }))}
                style={fi('left_choice')}
                placeholder="Swipe left option..."
                {...fFocus('left_choice')}
              />
            </FormField>

            <FormField label="Right Choice">
              <input
                value={form.right_choice || ''}
                onChange={(e) => setForm((f) => ({ ...f, right_choice: e.target.value }))}
                style={fi('right_choice')}
                placeholder="Swipe right option..."
                {...fFocus('right_choice')}
              />
            </FormField>
          </div>

          <FormField label="Left Lesson">
            <textarea
              value={form.left_lesson || ''}
              onChange={(e) => setForm((f) => ({ ...f, left_lesson: e.target.value }))}
              style={{ ...fi('left_lesson'), minHeight: 60, resize: 'vertical' as const, fontFamily: C.mono }}
              placeholder="Lesson shown after left swipe..."
              {...fFocus('left_lesson')}
            />
          </FormField>

          <FormField label="Right Lesson">
            <textarea
              value={form.right_lesson || ''}
              onChange={(e) => setForm((f) => ({ ...f, right_lesson: e.target.value }))}
              style={{
                ...fi('right_lesson'),
                minHeight: 60,
                resize: 'vertical' as const,
                fontFamily: C.mono,
              }}
              placeholder="Lesson shown after right swipe..."
              {...fFocus('right_lesson')}
            />
          </FormField>

          <FormField label="Topics (comma-separated)">
            <input
              value={topicsStr}
              onChange={(e) => setTopicsStr(e.target.value)}
              style={fi('topics')}
              placeholder="budgeting, saving, investing"
              {...fFocus('topics')}
            />
          </FormField>

          <FormField label="Linked Traits (comma-separated)">
            <input
              value={traitsStr}
              onChange={(e) => setTraitsStr(e.target.value)}
              style={fi('traits')}
              placeholder="risk_tolerant, growth_oriented"
              {...fFocus('traits')}
            />
          </FormField>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active ?? true}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: C.blue, cursor: 'pointer' }}
            />
            <label
              htmlFor="is_active"
              style={{
                fontFamily: C.mono,
                fontSize: 12,
                color: C.textDim,
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              CARD IS ACTIVE
            </label>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 1,
              padding: '10px 16px',
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
            {saving ? 'SAVING...' : isEdit ? 'SAVE CHANGES' : 'CREATE CARD'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
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
    </>
  )
}

export default function Cards() {
  const [cards, setCards] = useState<CardAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalCard, setModalCard] = useState<Partial<CardAdmin> | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCards()
      .then(setCards)
      .catch(() => setError('Failed to load cards.'))
      .finally(() => setLoading(false))
  }, [])

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    setToasts((prev) => [...prev, { id: nextToastId(), message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  function openCreate() {
    setModalCard(null)
    setModalOpen(true)
  }

  function openEdit(card: CardAdmin) {
    setModalCard(card)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setModalCard(null)
  }

  async function handleSave(data: Partial<CardAdmin>) {
    setSaving(true)
    try {
      if (modalCard?.id) {
        const updated = await updateCard(modalCard.id, data)
        setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        addToast('Card updated successfully.', 'success')
      } else {
        const created = await createCard(data)
        setCards((prev) => [...prev, created])
        addToast('Card created successfully.', 'success')
      }
      closeModal()
    } catch {
      addToast('Failed to save card.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(card: CardAdmin) {
    try {
      const updated = await updateCard(card.id, { is_active: !card.is_active })
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      addToast(
        `Card ${updated.is_active ? 'activated' : 'deactivated'}.`,
        'success'
      )
    } catch {
      addToast('Failed to toggle card status.', 'error')
    }
  }

  const bandColor = (name: string) => {
    const found = BAND_COLORS.find((b) => b.value === name)
    return found?.color || '#607d8b'
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

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 16,
        }}
      >
        <button
          onClick={openCreate}
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
          + NEW CARD
        </button>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.textDim, letterSpacing: '0.1em' }}>
            {cards.length} CARDS IN LIBRARY · {cards.filter((c) => c.is_active).length} ACTIVE
          </span>
        </div>

        {cards.length === 0 ? (
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
            NO CARDS FOUND
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['CARD_ID', 'TYPE', 'TITLE', 'STAGE', 'DIFF', 'COLOR', 'ACTIVE', 'ACTIONS'].map(
                    (h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {cards.map((card, i) => {
                  const even = i % 2 === 0
                  return (
                    <tr key={card.id}>
                      <td style={{ ...tdStyle(even), color: C.textDim, fontSize: 11 }}>
                        {card.card_id}
                      </td>
                      <td style={tdStyle(even)}>
                        <span
                          style={{
                            padding: '2px 8px',
                            background: `${typeColor(card.type)}22`,
                            border: `1px solid ${typeColor(card.type)}55`,
                            color: typeColor(card.type),
                            fontFamily: C.mono,
                            fontSize: 10,
                            letterSpacing: '0.08em',
                            fontWeight: 600,
                          }}
                        >
                          {card.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...tdStyle(even), maxWidth: 200 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {card.emoji} {card.title}
                        </span>
                      </td>
                      <td style={{ ...tdStyle(even), color: C.textDim }}>
                        S{card.stage_min}–S{card.stage_max}
                      </td>
                      <td style={{ ...tdStyle(even), color: C.textDim }}>
                        {(card.difficulty * 100).toFixed(0)}%
                      </td>
                      <td style={tdStyle(even)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 2,
                              background: bandColor(card.card_band_color),
                            }}
                          />
                          <span style={{ fontSize: 10, color: C.textDim }}>
                            {card.card_band_color}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle(even)}>
                        <span
                          style={{
                            color: card.is_active ? C.green : C.red,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {card.is_active ? '✓' : '✗'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle(even), whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => openEdit(card)}
                            style={{
                              padding: '4px 12px',
                              background: 'transparent',
                              border: `1px solid ${C.blue}`,
                              color: C.blue,
                              fontFamily: C.mono,
                              fontSize: 10,
                              letterSpacing: '0.08em',
                              cursor: 'pointer',
                            }}
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => handleToggleActive(card)}
                            style={{
                              padding: '4px 12px',
                              background: 'transparent',
                              border: `1px solid ${card.is_active ? C.red : C.green}`,
                              color: card.is_active ? C.red : C.green,
                              fontFamily: C.mono,
                              fontSize: 10,
                              letterSpacing: '0.08em',
                              cursor: 'pointer',
                            }}
                          >
                            {card.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <CardModal
          card={modalCard}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </>
  )
}
