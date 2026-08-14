'use client'

import useRetrievalStore from '@context/retrieval-store.tsx'
import { useChatSocket } from '@lib/sockets/use-chat-socket.ts'
import { WsContextChapter, WsErrorPayload } from '@lib/sockets/ws-protocol.ts'
import { ChatData, Message } from '@mytypes/types'
import ChatTopbar from '@ui/chat/chat-topbar'
import Composer from '@ui/chat/composer'
import MessageRow from '@ui/chat/message-row'
import CreateChat from '@ui/create-chat/create-chat.tsx'
import * as React from 'react'
import { useEffect, useRef } from 'react'

export function Chat({ chatData }: { chatData: ChatData }) {
  const [open, setOpen] = React.useState(false)
  const { setRetrieved } = useRetrievalStore()

  const [messages, setMessages] = React.useState<Message[]>(
    chatData.messages ?? []
  )

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  // Launcher on ChatHome stashes the first prompt before navigating here
  const sentDraft = useRef(false)

  const appendToLastAgentMessage = React.useCallback((newContent: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]

      if (last?.role === 'agent') {
        return [
          ...prev.slice(0, -1),
          { ...last, content: last.content + newContent }
        ]
      }

      // Frame from a turn started by another client on this session
      return [...prev, { role: 'agent', content: newContent }]
    })
  }, [])

  const replaceLastAgentMessage = React.useCallback((content: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]

      if (last?.role === 'agent' && last.content.length === 0) {
        return [...prev.slice(0, -1), { ...last, content }]
      }

      return [...prev, { role: 'agent' as const, content }]
    })
  }, [])

  const onContext = React.useCallback(
    (chapters: WsContextChapter[]) => {
      setRetrieved(
        chatData.id,
        chapters.map((c) => ({
          chapterId: c.chapter_id,
          chapterTag: c.chapter_tag,
          chapter: c.chapter,
          subchapter: c.subchapter,
          title: c.title,
          rerankScore: c.rerank_score
        }))
      )
    },
    [chatData.id, setRetrieved]
  )

  const onError = React.useCallback(
    (error: WsErrorPayload) => {
      replaceLastAgentMessage(
        `⚠️ ${error.detail ?? 'Something went wrong.'} (code ${error.code})`
      )
    },
    [replaceLastAgentMessage]
  )

  const { send, connected } = useChatSocket(chatData.id, {
    onContent: appendToLastAgentMessage,
    onContext,
    onError
  })

  const submit = React.useCallback(
    (text: string) => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'agent', content: '' }
      ])
      send(text)
    },
    [send]
  )

  useEffect(() => {
    if (!connected || sentDraft.current) return
    const draft = sessionStorage.getItem(`draft-${chatData.id}`)

    if (draft && (chatData.messages ?? []).length === 0) {
      sessionStorage.removeItem(`draft-${chatData.id}`)
      sentDraft.current = true
      submit(draft)
    }
  }, [connected, chatData.id, chatData.messages, submit])

  return (
    <>
      <ChatTopbar
        title={chatData.title}
        connected={connected}
        onNewChat={() => setOpen(true)}
      />

      <div ref={scrollContainerRef} className="thread scroll">
        <div className="thread-inner">
          {messages.map((msg, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <MessageRow key={idx} message={msg} />
          ))}
        </div>
      </div>

      <Composer onSubmit={submit} />
      <CreateChat open={open} setOpen={setOpen} />
    </>
  )
}
