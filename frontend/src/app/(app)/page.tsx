'use client'

import TopNav, { MainView } from '@components/shell/top-nav'
import AgentsView from '@components/views/agents-view'
import ChatHome from '@components/views/chat-home'
import FlashcardsView from '@components/views/flashcards-view'
import React from 'react'

export default function Home() {
  const [view, setView] = React.useState<MainView>('chat')

  return (
    <div className="main">
      <TopNav view={view} onChange={setView} />
      <div className="viewbody">
        <div className="content">
          {view === 'chat' && <ChatHome />}
          {view === 'flashcards' && <FlashcardsView />}
          {view === 'agents' && <AgentsView />}
        </div>
      </div>
    </div>
  )
}
