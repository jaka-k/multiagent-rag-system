'use client'

import { coverGradient } from '@components/shell/book-cover'
import { AreaFlashcardQueue } from '@mytypes/types'
import { stripHtml } from '@ui/flashcards/area-flashcard-card'

export default function QueueCard({
  queue,
  onOpen
}: {
  queue: AreaFlashcardQueue
  onOpen: () => void
}) {
  const pct = queue.cards.length
    ? Math.round((queue.studied / queue.cards.length) * 100)
    : 0

  return (
    <div className="queue">
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
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className="pl">
            {queue.studied} / {queue.cards.length} reviewed
            {queue.mastered > 0 && ` · ${queue.mastered} mastered`}
          </div>
        </div>
        <button type="button" className="qbadge" onClick={onOpen}>
          Open · {queue.cards.length}
        </button>
      </div>
    </div>
  )
}
