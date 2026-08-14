'use client'

import { coverGradient } from '@components/shell/book-cover'
import useAreaStore from '@context/area-store.tsx'
import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import { CheckCircle2, Grid2x2, Inbox, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

interface CardDto {
  id: string
  front: string
  back: string
  tag: string
  ankiId: string | null
  reps: number
  isMastered: boolean
}

interface QueueDto {
  sessionId: string
  sessionTitle: string
  updatedAt: string
  cards: CardDto[]
  studied: number
  mastered: number
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

type QueueFilter = 'all' | 'progress' | 'done'

export default function FlashcardsView() {
  const router = useRouter()
  const { activeArea } = useAreaStore()
  const [filter, setFilter] = React.useState<QueueFilter>('all')
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
            <span
              className="qbadge"
              style={{
                marginLeft: 'auto',
                background: 'var(--blue-wash)',
                color: 'var(--blue-ink)'
              }}
            >
              {loose.length} loose
            </span>
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

        <div className="filterbar">
          {(
            [
              ['all', 'All queues', <Grid2x2 key="g" size={15} />],
              ['progress', 'In progress', <Target key="t" size={15} />],
              ['done', 'Mastered', <CheckCircle2 key="c" size={15} />]
            ] as [QueueFilter, string, React.ReactNode][]
          ).map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              className={filter === id ? 'fchip on' : 'fchip'}
              onClick={() => setFilter(id)}
            >
              <span className="ic">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="queues">
          {queues
            .filter((q) => {
              if (filter === 'progress') return q.studied < q.cards.length

              if (filter === 'done')
                return q.cards.length > 0 && q.studied === q.cards.length

              return true
            })
            .map((queue) => (
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
                      <i
                        style={{
                          width: `${
                            queue.cards.length
                              ? Math.round(
                                  (queue.studied / queue.cards.length) * 100
                                )
                              : 0
                          }%`
                        }}
                      />
                    </div>
                    <div className="pl">
                      {queue.studied} / {queue.cards.length} reviewed
                      {queue.mastered > 0 && ` · ${queue.mastered} mastered`}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="qbadge"
                    onClick={() => router.push(`/chat/${queue.sessionId}`)}
                  >
                    Open · {queue.cards.length}
                  </button>
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
