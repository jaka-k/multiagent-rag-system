'use client'

import { Bot, Layers, MessageSquare } from 'lucide-react'
import React from 'react'

export type MainView = 'chat' | 'flashcards' | 'agents'

const TABS: { id: MainView; label: string; icon: React.ReactNode }[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageSquare size={16} />
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    icon: <Layers size={16} />
  },
  {
    id: 'agents',
    label: 'Agent Instructions',
    icon: <Bot size={16} />
  }
]

export default function TopNav({
  view,
  onChange,
  badges
}: {
  view: MainView
  onChange: (v: MainView) => void
  badges?: Partial<Record<MainView, number>>
}) {
  return (
    <div className="topnav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={view === tab.id ? 'tnav on' : 'tnav'}
          onClick={() => onChange(tab.id)}
        >
          <span className="ic">{tab.icon}</span>
          {tab.label}
          {badges?.[tab.id] != null && (
            <span className="nav-badge">{badges[tab.id]}</span>
          )}
        </button>
      ))}
    </div>
  )
}
