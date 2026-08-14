'use client'

import useRetrievalStore, {
  RetrievedChapter
} from '@context/retrieval-store.tsx'
import { getChatRetrievals } from '@lib/fetchers/fetch-retrievals.ts'
import ChapterReader from '@ui/chat/chapter-reader'
import React from 'react'

export default function RetrievedChapters({ chatId }: { chatId: string }) {
  const { byChat } = useRetrievalStore()
  const [persisted, setPersisted] = React.useState<RetrievedChapter[]>([])
  const [openTag, setOpenTag] = React.useState<string | null>(null)

  React.useEffect(() => {
    getChatRetrievals(chatId).then((groups) => {
      if (groups.length > 0) {
        setPersisted(
          groups[0].chapters.map((c) => ({
            chapterId: c.chapterId,
            chapterTag: c.chapterTag,
            chapter: c.chapter,
            subchapter: c.subchapter,
            rerankScore: c.relevanceScore
          }))
        )
      }
    })
  }, [chatId])

  const chapters = byChat[chatId] ?? persisted
  const active = chapters.find((c) => c.chapterTag === openTag)

  return (
    <div className="side-body">
      <div className="retr-head">
        <span className="lbl">Retrieved for this answer</span>
        <span className="retr-ct">{chapters.length}</span>
      </div>
      <div className="scroll" style={{ maxHeight: openTag ? '38%' : '100%' }}>
        {chapters.map((chapter, i) => (
          <div
            key={chapter.chapterId}
            className={openTag === chapter.chapterTag ? 'chap active' : 'chap'}
          >
            <div className="chap-row">
              <button
                type="button"
                className="chap-open"
                onClick={() =>
                  setOpenTag(
                    openTag === chapter.chapterTag ? null : chapter.chapterTag
                  )
                }
              >
                <span className="chap-num">{i + 1}</span>
                <span className="chap-t">
                  {chapter.subchapter}
                  <span className="small">{chapter.chapter}</span>
                </span>
                <span
                  className={chapter.rerankScore >= 5 ? 'relev' : 'relev lo'}
                >
                  {Math.round(chapter.rerankScore * 10)}%
                </span>
              </button>
            </div>
          </div>
        ))}
        {chapters.length === 0 && (
          <div className="empty-hint">
            Ask something — the chapters used for the answer appear here.
          </div>
        )}
      </div>
      {active && (
        <ChapterReader
          chapterTag={active.chapterTag}
          title={active.subchapter}
          onClose={() => setOpenTag(null)}
        />
      )}
    </div>
  )
}
