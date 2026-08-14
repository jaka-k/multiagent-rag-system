'use client'

import useAreaStore from '@context/area-store.tsx'
import useConsoleStore from '@context/console-store.tsx'
import RetrievedChapters from '@ui/chat/retrieved-chapters'
import SSEPill from '@ui/console/sse-pill'
import FeatureOverlay from '@ui/feature-overlay.tsx'
import FlashcardCreator from '@ui/flashcard-creator/flashcard-creator'
import FlashcardList from '@ui/flashcards/flashcard-list'
import { BookOpen, Bot, GraduationCap } from 'lucide-react'
import React, { useEffect } from 'react'

type SideTab = 'chapters' | 'flashcards' | 'creator'

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
      <div className="side-pad" style={{ paddingBottom: 0 }}>
        <SSEPill chatId={chatId} />
      </div>
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
      {tab === 'chapters' && <RetrievedChapters chatId={chatId} />}
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
