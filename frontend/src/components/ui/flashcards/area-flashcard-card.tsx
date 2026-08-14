'use client'

import { AreaFlashcard } from '@mytypes/types'

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tagClass(tag: string): string {
  const t = tag.toLowerCase()

  if (t.includes('code') || t.includes('syntax')) return 'ftag code'

  if (t.includes('pattern') || t.includes('concept')) return 'ftag concept'

  if (t.includes('architect')) return 'ftag cloze'

  return 'ftag def'
}

export default function AreaFlashcardCard({ card }: { card: AreaFlashcard }) {
  return (
    <div className="fcard">
      <div
        className="accent"
        style={{ background: 'var(--accent)', opacity: 0.75 }}
      />
      <div className="fcard-in">
        <div className="tagrow">
          <span className={tagClass(card.tag)}>{card.tag || 'card'}</span>
          {card.isMastered ? (
            <span className="ftag cloze">mastered</span>
          ) : (
            card.ankiId && <span className="ftag ghost">in Anki</span>
          )}
        </div>
        <div className="q">{stripHtml(card.front).slice(0, 140)}</div>
        <div className="a divider">{stripHtml(card.back).slice(0, 180)}</div>
      </div>
    </div>
  )
}
