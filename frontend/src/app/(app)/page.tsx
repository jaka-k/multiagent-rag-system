'use client'

import TopNav, { MainView } from '@components/shell/top-nav'
import ChatHome from '@components/views/chat-home'
import React from 'react'

export default function Home() {
  const [view, setView] = React.useState<MainView>('chat')

  return (
    <div className="main">
      <TopNav view={view} onChange={setView} />
      <div className="viewbody">
        <div className="content">
          {view === 'chat' && <ChatHome />}
          {view === 'flashcards' && (
            <div className="empty-hint" style={{ marginTop: 80 }}>
              Flashcards view — under construction (docs/rework/04 phase 5)
            </div>
          )}
          {view === 'agents' && (
            <div className="empty-hint" style={{ marginTop: 80 }}>
              Agent Instructions — under construction (docs/rework/04 phase 7)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
