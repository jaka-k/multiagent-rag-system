'use client'

import { Check, Lock } from 'lucide-react'
import React from 'react'

const PIN_LENGTH = 8

interface PinGateProps {
  unlocked: boolean
  validate: (code: string) => Promise<boolean>
  onUnlock: (code: string) => void
}

/** 8-digit beta invite gate — unlocks the register form on a server-validated code. */
export function PinGate({ unlocked, validate, onUnlock }: PinGateProps) {
  const [digits, setDigits] = React.useState<string[]>(
    Array(PIN_LENGTH).fill('')
  )
  const [err, setErr] = React.useState(false)
  const [checking, setChecking] = React.useState(false)
  const refs = React.useRef<(HTMLInputElement | null)[]>([])

  const reset = () => {
    setDigits(Array(PIN_LENGTH).fill(''))
    refs.current[0]?.focus()
  }

  const commit = async (next: string[]) => {
    setDigits(next)
    setErr(false)

    if (next.some((d) => d === '')) return

    setChecking(true)
    let ok = false

    try {
      ok = await validate(next.join(''))
    } catch {
      ok = false
    } finally {
      setChecking(false)
    }

    if (ok) {
      onUnlock(next.join(''))
    } else {
      setErr(true)
      setTimeout(reset, 550)
    }
  }

  const onChange = (i: number, value: string) => {
    const c = value.replace(/\D/g, '').slice(-1)

    if (!c) return

    const next = digits.slice()

    next[i] = c
    commit(next)
    if (i < PIN_LENGTH - 1) refs.current[i + 1]?.focus()
  }

  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = digits.slice()

      if (next[i]) {
        next[i] = ''
      } else if (i > 0) {
        next[i - 1] = ''
        refs.current[i - 1]?.focus()
      }

      setDigits(next)
      setErr(false)
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < PIN_LENGTH - 1) {
      refs.current[i + 1]?.focus()
    }
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const text = (e.clipboardData.getData('text') || '')
      .replace(/\D/g, '')
      .slice(0, PIN_LENGTH)

    if (!text) return

    e.preventDefault()
    commit(Array.from({ length: PIN_LENGTH }, (_, i) => text[i] || ''))
    refs.current[Math.min(text.length, PIN_LENGTH - 1)]?.focus()
  }

  return (
    <div className={`pingate${unlocked ? ' ok' : ''}${err ? ' bad' : ''}`}>
      <div className="pg-head">
        <div className="pg-ico">
          {unlocked ? <Check size={15} /> : <Lock size={15} />}
        </div>
        <div>
          <div className="pg-t">
            {unlocked ? 'Beta access confirmed' : 'Beta tester code'}
          </div>
          <div className="pg-s">
            {unlocked
              ? 'You can complete your registration below.'
              : 'Enter the 8-digit code from your invite email.'}
          </div>
        </div>
      </div>
      {!unlocked && (
        <>
          <div className="pinrow" onPaste={onPaste}>
            {digits.map((d, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <React.Fragment key={i}>
                <input
                  ref={(el) => {
                    refs.current[i] = el
                  }}
                  className={d ? 'pin filled' : 'pin'}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  autoFocus={i === 0}
                  disabled={checking}
                  onChange={(e) => onChange(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                />
                {i === 3 && <span className="pin-sep" />}
              </React.Fragment>
            ))}
          </div>
          <div className={err ? 'pg-msg show' : 'pg-msg'}>
            That code isn&apos;t valid. Check your invite email and try again.
          </div>
        </>
      )}
    </div>
  )
}
