'use client'

import { BookCover } from '@components/shell/book-cover'
import { createVectorEmbedding } from '@lib/fetchers/fetch-embedding.ts'
import { logger } from '@lib/logger.ts'
import type { Document } from '@mytypes/types.d.ts'
import { Zap } from 'lucide-react'
import React from 'react'

const BUSY_LABEL: Record<string, string> = {
  processing: 'Parsing chapters…',
  embedding: 'Embedding chapters…'
}

export function BookRow({
  doc,
  onRetried
}: {
  doc: Document
  onRetried: () => void
}) {
  const status = doc.embeddingStatus
  const busy = status === 'processing' || status === 'embedding'

  const retry = async () => {
    // fetchWithAuth doesn't throw on non-2xx — check ok explicitly.
    const response = await createVectorEmbedding(doc.id)

    if (!response.ok) {
      logger.error({ response: response.data }, 'Failed to restart indexing')

      return
    }

    onRetried()
  }

  return (
    <div className="book">
      <BookCover title={doc.title} />
      <div className="book-meta">
        <div className="t">{doc.title}</div>
        {busy && (
          <div className="bstat busy">
            <span>{BUSY_LABEL[status]}</span>
          </div>
        )}
        {status === 'failed' && (
          <button type="button" className="bstat fail" onClick={retry}>
            <Zap size={11} /> Indexing failed · <b>Retry</b>
          </button>
        )}
        {!busy && status !== 'failed' && (
          <div className="a">{doc.author ?? '—'}</div>
        )}
      </div>
      {status === 'completed' && <span className="book-dot" title="Indexed" />}
      {busy && <span className="book-dot busy" title={BUSY_LABEL[status]} />}
      {status === 'failed' && <span className="book-dot err" title="Failed" />}
    </div>
  )
}
