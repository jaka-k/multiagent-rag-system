'use client'

import { coverGradient } from '@components/shell/book-cover'
import useAreaStore from '@context/area-store.tsx'
import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import { Inbox } from 'lucide-react'
import React from 'react'

interface CardDto {
  id: string
  front: string
  back: string
  tag: string
  ankiId: string | null
}

interface QueueDto {
  sessionId: string
  sessionTitle: string
  updatedAt: string
  cards: CardDto[]
}

interface AreaCards {
  queues: QueueDto[]
  loose: CardDto[]
}

function stripHtml(html: string): string {
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

function Card({ card }: { card: CardDto }) {
  return (
    <div className="fcard">
      <div
        className="accent"
        style={{ background: 'var(--accent)', opacity: 0.75 }}
      />
      <div className="fcard-in">
        <div className="tagrow">
          <span className={tagClass(card.tag)}>{card.tag || 'card'}</span>
          {card.ankiId && <span className="ftag ghost">in Anki</span>}
        </div>
        <div className="q">{stripHtml(card.front).slice(0, 140)}</div>
        <div className="a divider">{stripHtml(card.back).slice(0, 180)}</div>
      </div>
    </div>
  )
}

export default function FlashcardsView() {
  const { activeArea } = useAreaStore()
  const [data, setData] = React.useState<AreaCards | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!activeArea) return
    fetchWithAuth<AreaCards>(`/api/area/${activeArea.id}/flashcards`, {
      method: 'GET'
    })
      .then((r) => (r.ok ? setData(r.data) : setError('Failed to load cards')))
      .catch(() => setError('Failed to load cards'))
  }, [activeArea])

  if (error) return <div className="empty-hint">{error}</div>

  const queues = data?.queues ?? []
  const loose = data?.loose ?? []
  const total = queues.reduce((n, q) => n + q.cards.length, 0) + loose.length

  return (
    <div className="page scroll fade">
      <div className="page-inner">
        <div className="sec-head">
          <h2>Flashcards</h2>
          <span className="desc">
            {total} cards across {queues.length} sessions
          </span>
        </div>

        <div className="loose-band">
          <div className="loose-head">
            <div className="ico">
              <Inbox size={17} />
            </div>
            <div>
              <h3>Loose cards</h3>
              <p>
                Not in a queue yet — clipped or imported cards land here first
              </p>
            </div>
          </div>
          {loose.length > 0 ? (
            <div className="loose-grid">
              {loose.slice(0, 8).map((card) => (
                <Card key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="empty-hint">No loose cards</div>
          )}
        </div>

        <div className="queues">
          {queues.map((queue) => (
            <div key={queue.sessionId} className="queue">
              <div className="queue-top">
                <div
                  className="qcover"
                  style={{ background: coverGradient(queue.sessionTitle) }}
                />
                <div>
                  <h3>{queue.sessionTitle}</h3>
                  <div className="qsub">
                    <span className="b">{queue.cards.length} cards</span>
                    <span className="dotsep" />
                    <span>from this session</span>
                  </div>
                </div>
              </div>
              {queue.cards[0] && (
                <div className="qpreview">
                  <div className="ql">Next card</div>
                  <div className="qq">
                    {stripHtml(queue.cards[0].front).slice(0, 120)}
                  </div>
                </div>
              )}
              <div className="queue-foot">
                <div className="qprog">
                  <div className="bar">
                    <i style={{ width: '0%' }} />
                  </div>
                  <div className="pl">
                    Review progress arrives with the Anki pull-sync
                  </div>
                </div>
                <span className="qbadge">{queue.cards.length}</span>
              </div>
            </div>
          ))}
        </div>

        {queues.length === 0 && loose.length === 0 && (
          <div className="empty-hint">
            No flashcards in this area yet — they are generated while you chat.
          </div>
        )}
      </div>
    </div>
  )
}
