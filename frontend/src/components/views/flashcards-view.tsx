'use client'

import useAreaStore from '@context/area-store.tsx'
import { getAreaFlashcards } from '@lib/fetchers/fetch-flashcards.ts'
import { AreaFlashcards } from '@mytypes/types'
import AreaFlashcardCard from '@ui/flashcards/area-flashcard-card'
import QueueCard from '@ui/flashcards/queue-card'
import { CheckCircle2, Grid2x2, Inbox, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

type QueueFilter = 'all' | 'progress' | 'done'

const FILTERS: [QueueFilter, string, React.ReactNode][] = [
  ['all', 'All queues', <Grid2x2 key="g" size={15} />],
  ['progress', 'In progress', <Target key="t" size={15} />],
  ['done', 'Mastered', <CheckCircle2 key="c" size={15} />]
]

export default function FlashcardsView() {
  const router = useRouter()
  const { activeArea } = useAreaStore()
  const [data, setData] = React.useState<AreaFlashcards | null>(null)
  const [failed, setFailed] = React.useState(false)
  const [filter, setFilter] = React.useState<QueueFilter>('all')

  React.useEffect(() => {
    if (!activeArea) return
    setData(null)
    setFailed(false)
    getAreaFlashcards(activeArea.id).then((result) => {
      if (result) setData(result)
      else setFailed(true)
    })
  }, [activeArea])

  if (failed) {
    return <div className="empty-hint">Failed to load cards — try again.</div>
  }

  if (activeArea && data === null) {
    return <div className="empty-hint">Loading cards…</div>
  }

  const queues = (data?.queues ?? []).filter((q) => {
    if (filter === 'progress') return q.studied < q.cards.length

    if (filter === 'done')
      return q.cards.length > 0 && q.studied === q.cards.length

    return true
  })
  const loose = data?.loose ?? []
  const total =
    (data?.queues ?? []).reduce((n, q) => n + q.cards.length, 0) + loose.length

  return (
    <div className="page scroll fade">
      <div className="page-inner">
        <div className="sec-head">
          <h2>Flashcards</h2>
          <span className="desc">
            {total} cards across {(data?.queues ?? []).length} sessions
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
                <AreaFlashcardCard key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="empty-hint">No loose cards</div>
          )}
        </div>

        <div className="filterbar">
          {FILTERS.map(([id, label, icon]) => (
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
          {queues.map((queue) => (
            <QueueCard
              key={queue.sessionId}
              queue={queue}
              onOpen={() => router.push(`/chat/${queue.sessionId}`)}
            />
          ))}
        </div>

        {total === 0 && (
          <div className="empty-hint">
            No flashcards in this area yet — they are generated while you chat.
          </div>
        )}
      </div>
    </div>
  )
}
