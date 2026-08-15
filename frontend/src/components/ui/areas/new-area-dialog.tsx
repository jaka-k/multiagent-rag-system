'use client'

import { Layers, LoaderCircle, Plus, X } from 'lucide-react'
import React from 'react'

/* Mirrored in backend server/models/area.py — the backend assigns a
   deterministic pick from this palette when no color is chosen. */
export const AREA_COLORS = [
  '#0085FF',
  '#9360FF',
  '#16B27A',
  '#F2576B',
  '#F2A33C',
  '#2FA7C7'
]

interface NewAreaDialogProps {
  onClose: () => void
  onCreate: (name: string, color: string) => Promise<void>
}

export function NewAreaDialog({ onClose, onCreate }: NewAreaDialogProps) {
  const [name, setName] = React.useState('')
  const [color, setColor] = React.useState(AREA_COLORS[4])
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const create = async () => {
    setPending(true)

    try {
      await onCreate(name.trim(), color)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-area-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="m-head">
          {/* 0x24 ≈ 14% alpha wash behind the icon, in the picked color */}
          <div className="m-ico" style={{ background: `${color}24`, color }}>
            <Layers size={18} />
          </div>
          <div>
            <h3 id="new-area-title">New area</h3>
            <p>An area groups books, chats and card sets around one subject.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="m-body">
          <div className="field">
            <div className="flbl">Name</div>
            <input
              className="ta one"
              placeholder="e.g. Machine Learning"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <div className="flbl">Label color</div>
            <div className="swrow">
              {AREA_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={color === c ? 'sw on' : 'sw'}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="m-preview">
            <span className="adot" style={{ background: color }} />
            <span>{name || 'Area name'}</span>
            <span className="mp-count">0 books</span>
          </div>
        </div>
        <div className="m-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-pri"
            disabled={!name.trim() || pending}
            onClick={create}
          >
            {pending ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            Create area
          </button>
        </div>
      </div>
    </div>
  )
}
