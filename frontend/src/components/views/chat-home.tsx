'use client'

import { areaDotColor } from '@components/shell/rail'
import useAreaStore from '@context/area-store.tsx'
import useChatStore from '@context/chats-store.tsx'
import { createChat } from '@lib/fetchers/fetch-chat.ts'
import { Chat } from '@mytypes/types'
import { ChevronRight, Layers, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

type ChatWithTime = Chat & { updatedAt?: string }

function groupLabel(iso?: string): string {
  if (!iso) return 'Earlier'
  const then = new Date(iso)
  const now = new Date()
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dayDiff = (startOfDay(now) - startOfDay(then)) / 86_400_000

  if (dayDiff <= 0) return 'Today'

  if (dayDiff === 1) return 'Yesterday'

  return 'Earlier'
}

function relTime(iso?: string): string {
  if (!iso) return ''
  const mins = Math.max(1, Math.round((Date.now() - +new Date(iso)) / 60_000))

  if (mins < 60) return `${mins}m ago`

  if (mins < 1440) return `${Math.round(mins / 60)}h ago`

  return `${Math.round(mins / 1440)}d ago`
}

export default function ChatHome() {
  const router = useRouter()
  const { activeArea } = useAreaStore()
  const { chats, fetchChatsForUser } = useChatStore()
  const [prompt, setPrompt] = React.useState('')
  const [creating, setCreating] = React.useState(false)

  React.useEffect(() => {
    fetchChatsForUser()
  }, [fetchChatsForUser])

  const areaChats = (chats as ChatWithTime[])
    .filter((c) => !activeArea || c.areaId === activeArea.id)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))

  const groups: [string, ChatWithTime[]][] = []

  areaChats.forEach((chat) => {
    const label = groupLabel(chat.updatedAt)
    const last = groups[groups.length - 1]

    if (last && last[0] === label) last[1].push(chat)
    else groups.push([label, [chat]])
  })

  async function launch() {
    if (!prompt.trim() || !activeArea || creating) return
    setCreating(true)

    try {
      const title =
        prompt.trim().split(/\s+/).slice(0, 6).join(' ') +
        (prompt.trim().split(/\s+/).length > 6 ? '…' : '')
      const chat = await createChat(title, activeArea.id)
      sessionStorage.setItem(`draft-${chat.id}`, prompt.trim())
      router.push(`/chat/${chat.id}`)
    } finally {
      setCreating(false)
    }
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

        <div className="launch">
          <div className="lrow">
            <textarea
              rows={2}
              placeholder="Ask about your books…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  launch()
                }
              }}
            />
            <button
              type="button"
              className="send"
              onClick={launch}
              disabled={creating}
              aria-label="Start chat"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="lbar">
            <span className="scope-pick">
              <span
                className="adot"
                style={{
                  background: activeArea ? areaDotColor(activeArea.id) : '#666'
                }}
              />
              {activeArea?.name ?? 'No area selected'}
            </span>
          </div>
        </div>

        <div className="sessions">
          <div className="sess-bar">
            <h2>Sessions</h2>
            <span className="ct">{areaChats.length} in this area</span>
          </div>

          {groups.map(([label, groupChats]) => (
            <div key={label}>
              <div className="sess-group-lbl">{label}</div>
              {groupChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className="sess"
                  onClick={() => router.push(`/chat/${chat.id}`)}
                >
                  <div
                    className="scover"
                    style={{
                      background: `linear-gradient(150deg, ${areaDotColor(chat.areaId)}, var(--ink-2))`
                    }}
                  />
                  <div className="sess-mid">
                    <div className="st">{chat.title}</div>
                    <div className="ss-meta">
                      {chat.totalTokens > 0
                        ? `${chat.totalTokens.toLocaleString()} tokens`
                        : 'New session'}
                    </div>
                  </div>
                  <div className="sess-meta">
                    <span className="mcards">
                      <Layers size={12} />
                      cards
                    </span>
                    <span className="mtime">{relTime(chat.updatedAt)}</span>
                  </div>
                  <span className="schev">
                    <ChevronRight size={16} />
                  </span>
                </button>
              ))}
            </div>
          ))}

          {areaChats.length === 0 && (
            <div className="empty-hint">
              No sessions in this area yet — start one above.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
