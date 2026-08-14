'use client'

import { getSingleChapter } from '@lib/fetchers/fetch-chapters.ts'
import { X } from 'lucide-react'
import React from 'react'
import Markdown from 'react-markdown'

export default function ChapterReader({
  chapterTag,
  title,
  onClose
}: {
  chapterTag: string
  title: string
  onClose: () => void
}) {
  const [content, setContent] = React.useState('')

  React.useEffect(() => {
    setContent('')
    getSingleChapter(chapterTag).then((data) => {
      setContent(data?.chapter?.content ?? 'No content available.')
    })
  }, [chapterTag])

  return (
    <div className="reader-pane">
      <div className="reader-head">
        <span className="rt">{title}</span>
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label="Close reader"
        >
          <X size={14} />
        </button>
      </div>
      <div className="reader scroll">
        {content ? (
          <Markdown>{content}</Markdown>
        ) : (
          <div className="empty-hint">Loading chapter…</div>
        )}
      </div>
    </div>
  )
}
