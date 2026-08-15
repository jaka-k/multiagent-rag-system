'use client'

import { dayGroupLabel, relativeTime } from '@lib/utils'
import { Chat } from '@mytypes/types'
import { ChevronRight, Layers } from 'lucide-react'

type ChatWithTime = Chat & { updatedAt?: string }

function groupByDay(chats: ChatWithTime[]): [string, ChatWithTime[]][] {
  const groups: [string, ChatWithTime[]][] = []

  chats.forEach((chat) => {
    const label = dayGroupLabel(chat.updatedAt)
    const last = groups[groups.length - 1]

    if (last && last[0] === label) last[1].push(chat)
    else groups.push([label, [chat]])
  })

  return groups
}

export default function SessionList({
  chats,
  areaColor,
  onOpen
}: {
  chats: ChatWithTime[]
  areaColor?: string
  onOpen: (chatId: string) => void
}) {
  return (
    <div className="sessions">
      <div className="sess-bar">
        <h2>Sessions</h2>
        <span className="ct">{chats.length} in this area</span>
      </div>

      {groupByDay(chats).map(([label, groupChats]) => (
        <div key={label}>
          <div className="sess-group-lbl">{label}</div>
          {groupChats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              className="sess"
              onClick={() => onOpen(chat.id)}
            >
              <div
                className="scover"
                style={{
                  background: `linear-gradient(150deg, ${areaColor ?? '#666'}, var(--ink-2))`
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
                <span className="mtime">{relativeTime(chat.updatedAt)}</span>
              </div>
              <span className="schev">
                <ChevronRight size={16} />
              </span>
            </button>
          ))}
        </div>
      ))}

      {chats.length === 0 && (
        <div className="empty-hint">
          No sessions in this area yet — start one above.
        </div>
      )}
    </div>
  )
}
