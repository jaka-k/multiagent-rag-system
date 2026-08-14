'use client'

import useAreaStore from '@context/area-store.tsx'
import useChatStore from '@context/chats-store.tsx'
import { createChat } from '@lib/fetchers/fetch-chat.ts'
import { Chat } from '@mytypes/types'
import Launcher from '@ui/chat-home/launcher'
import SessionList from '@ui/chat-home/session-list'
import { useRouter } from 'next/navigation'
import React from 'react'

type ChatWithTime = Chat & { updatedAt?: string }

export default function ChatHome() {
  const router = useRouter()
  const { activeArea } = useAreaStore()
  const { chats, fetchChatsForUser } = useChatStore()

  React.useEffect(() => {
    fetchChatsForUser()
  }, [fetchChatsForUser])

  const areaChats = (chats as ChatWithTime[])
    .filter((c) => !activeArea || c.areaId === activeArea.id)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))

  async function launch(prompt: string) {
    if (!activeArea) return
    const words = prompt.split(/\s+/)
    const title = words.slice(0, 6).join(' ') + (words.length > 6 ? '…' : '')
    const chat = await createChat(title, activeArea.id)
    sessionStorage.setItem(`draft-${chat.id}`, prompt)
    router.push(`/chat/${chat.id}`)
  }

  return (
    <div className="home scroll fade">
      <div className="home-inner">
        <div className="hero">
          <div className="hi">
            Studying {activeArea?.name ?? '—'} · {areaChats.length} sessions
          </div>
          <h1>
            What do you want to <span className="grad">learn?</span>
          </h1>
          <p>
            Ask anything about your books — answers come with sources, and
            flashcards build themselves as you go.
          </p>
        </div>

        <Launcher area={activeArea} onLaunch={launch} />

        <SessionList
          chats={areaChats}
          onOpen={(chatId) => router.push(`/chat/${chatId}`)}
        />
      </div>
    </div>
  )
}
