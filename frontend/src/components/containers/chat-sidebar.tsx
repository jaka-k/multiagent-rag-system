'use client'

import useAreaStore from '@context/area-store.tsx'
import useConsoleStore from '@context/console-store.tsx'
import useRetrievalStore, {
  RetrievedChapter
} from '@context/retrieval-store.tsx'
import { getSingleChapter } from '@lib/fetchers/fetch-chapters.ts'
import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import FeatureOverlay from '@ui/feature-overlay.tsx'
import FlashcardCreator from '@ui/flashcard-creator/flashcard-creator'
import FlashcardList from '@ui/flashcards/flashcard-list'
import { BookOpen, Bot, GraduationCap, X } from 'lucide-react'
import React, { useEffect } from 'react'
import Markdown from 'react-markdown'

type SideTab = 'chapters' | 'flashcards' | 'creator'

interface RetrievalGroup {
  messageId: string
  createdAt: string
  chapters: {
    chapterId: string
    chapterTag: string
    chapter: string
    subchapter: string
    relevanceScore: number
    rank: number
  }[]
}

function RetrievedList({ chatId }: { chatId: string }) {
  const { byChat } = useRetrievalStore()
  const [persisted, setPersisted] = React.useState<RetrievedChapter[]>([])
  const [openTag, setOpenTag] = React.useState<string | null>(null)
  const [chapterText, setChapterText] = React.useState<string>('')

  useEffect(() => {
    fetchWithAuth<RetrievalGroup[]>(`/api/chat/${chatId}/retrievals`, {
      method: 'GET'
    }).then((r) => {
      if (r.ok && r.data.length > 0) {
        setPersisted(
          r.data[0].chapters.map((c) => ({
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

  const live = byChat[chatId]
  const chapters = live ?? persisted

  async function openChapter(tag: string) {
    if (openTag === tag) {
      setOpenTag(null)

      return
    }

    setOpenTag(tag)
    setChapterText('')
    const data = await getSingleChapter(tag)
    const chapter = (data as { chapter?: { content?: string } })?.chapter
    setChapterText(chapter?.content ?? 'No content available.')
  }

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
                onClick={() => openChapter(chapter.chapterTag)}
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
        <div className="reader-pane">
          <div className="reader-head">
            <span className="rt">{active.subchapter}</span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setOpenTag(null)}
              aria-label="Close reader"
            >
              <X size={14} />
            </button>
          </div>
          <div className="reader scroll">
            {chapterText ? (
              <Markdown>{chapterText}</Markdown>
            ) : (
              <div className="empty-hint">Loading chapter…</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const TABS: { id: SideTab; label: string; icon: React.ReactNode }[] = [
  { id: 'chapters', label: 'Chapters', icon: <BookOpen size={16} /> },
  { id: 'flashcards', label: 'Flashcards', icon: <GraduationCap size={16} /> },
  { id: 'creator', label: 'Creator', icon: <Bot size={16} /> }
]

const ChatSidebar = ({
  chatId,
  areaId
}: {
  chatId: string
  areaId: string
}) => {
  const [tab, setTab] = React.useState<SideTab>('chapters')
  const { setActiveArea } = useAreaStore.getState()
  const { fetchConsoleQueues, setCurrentConsole } = useConsoleStore.getState()

  useEffect(() => {
    setActiveArea(areaId)
    setCurrentConsole(chatId)
    fetchConsoleQueues(chatId)
  }, [chatId, areaId, setCurrentConsole, fetchConsoleQueues, setActiveArea])

  return (
    <aside className="sidebar">
      <div className="side-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'side-tab on' : 'side-tab'}
            onClick={() => setTab(t.id)}
          >
            <span className="ic">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'chapters' && <RetrievedList chatId={chatId} />}
      {tab === 'flashcards' && (
        <div className="side-pad scroll">
          <FlashcardList chatId={chatId} areaId={areaId} />
        </div>
      )}
      {tab === 'creator' && (
        <div className="side-pad scroll">
          <FeatureOverlay>
            <FlashcardCreator />
          </FeatureOverlay>
        </div>
      )}
    </aside>
  )
}

export default ChatSidebar
