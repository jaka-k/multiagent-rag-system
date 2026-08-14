'use client'

import useRetrievalStore, {
  RetrievedChapter
} from '@context/retrieval-store.tsx'
import { logger } from '@lib/logger.ts'
import { connectionStatusMapping } from '@lib/utils'
import { ChatData, Message } from '@mytypes/types'
import CreateChat from '@ui/create-chat/create-chat.tsx'
import { ArrowLeft, Plus, Send } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { useEffect, useRef } from 'react'
import Markdown from 'react-markdown'
import useWebSocket from 'react-use-websocket'
import rehypeHighlight from 'rehype-highlight'

export const BACKEND_DOMAIN =
  process.env.NEXT_PUBLIC_BACKEND_DOMAIN || 'localhost:8080'

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

const isProd = process.env.NODE_ENV === 'production'
const wsProtocol = isProd ? 'wss' : 'ws'

export function Chat({ chatData }: { chatData: ChatData }) {
  const socketUrl = `${wsProtocol}://${BACKEND_DOMAIN}/api/ws/${chatData.id}`
  const [open, setOpen] = React.useState(false)
  const { setRetrieved } = useRetrievalStore()

  const [messages, setMessages] = React.useState<Message[]>(
    chatData.messages ?? []
  )
  const [input, setInput] = React.useState('')
  const inputLength = input.trim().length

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  // Launcher on ChatHome stashes the first prompt before navigating here
  const sentDraft = useRef(false)

  const replaceLastAgentMessage = (content: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]

      if (last?.role === 'agent' && last.content.length === 0) {
        return [...prev.slice(0, -1), { ...last, content }]
      }

      return [...prev, { role: 'agent' as const, content }]
    })
  }

  const appendToLastAgentMessage = (newContent: string) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1]

      if (lastMessage.role === 'agent') {
        return [
          ...prevMessages.slice(0, prevMessages.length - 1),
          {
            ...lastMessage,
            content: lastMessage.content + newContent
          }
        ]
      }

      return prevMessages
    })
  }

  const { sendMessage, readyState } = useWebSocket(socketUrl, {
    onMessage(event) {
      try {
        const messageData = JSON.parse(event.data)

        if (messageData.content) {
          appendToLastAgentMessage(messageData.content)
        } else if (messageData.error) {
          replaceLastAgentMessage(
            `⚠️ ${messageData.error.detail ?? 'Something went wrong.'}${
              messageData.error.code ? ` (code ${messageData.error.code})` : ''
            }`
          )
        } else if (messageData.context) {
          setRetrieved(
            chatData.id,
            messageData.context.map(
              (c: Record<string, unknown>): RetrievedChapter => ({
                chapterId: String(c.chapter_id ?? ''),
                chapterTag: String(c.chapter_tag ?? ''),
                chapter: String(c.chapter ?? ''),
                subchapter: String(c.subchapter ?? ''),
                title: c.title ? String(c.title) : undefined,
                rerankScore: Number(c.rerank_score ?? 0)
              })
            )
          )
        }
      } catch (error) {
        logger.error({ err: error }, 'Error parsing WebSocket message')
      }
    },
    onClose: () => {},
    shouldReconnect: () => true
  })
  const connectionStatus = connectionStatusMapping(readyState)
  const connected = connectionStatus === 'Open'

  const submit = React.useCallback(
    (text: string) => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'agent', content: '' }
      ])
      sendMessage(text)
    },
    [sendMessage]
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

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputLength === 0) return
    submit(input)
    setInput('')
  }

  return (
    <>
      <div className="topbar">
        <Link href="/">
          <span className="backbtn">
            <ArrowLeft size={16} />
          </span>
        </Link>
        <div className="crumb">
          <span className="ti">{chatData.title}</span>
        </div>
        <span className="pill model">
          <span
            className="dot"
            style={{ background: connected ? 'var(--green)' : 'var(--rose)' }}
          />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        <div className="top-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setOpen(true)}
            aria-label="New chat"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="thread scroll">
        <div className="thread-inner">
          {messages.map((msg, idx) =>
            msg.content.length === 0 ? (
              // eslint-disable-next-line react/no-array-index-key
              <div key={idx} className="thinking">
                Thinking…
              </div>
            ) : (
              // eslint-disable-next-line react/no-array-index-key
              <div
                key={idx}
                className={`msg ${msg.role === 'user' ? 'user' : 'bot'}`}
              >
                <div className="who">{msg.role === 'user' ? 'You' : 'AI'}</div>
                <div className="body">
                  {msg.role === 'user' ? (
                    <div className="bubble-user">{msg.content}</div>
                  ) : (
                    <Markdown
                      rehypePlugins={[rehypeHighlight]}
                      className="prose chat-code"
                    >
                      {msg.content}
                    </Markdown>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="composer-wrap">
        <form onSubmit={handleSendMessage}>
          <div className="composer">
            <div className="row1">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your books…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()

                    if (input.trim()) {
                      submit(input)
                      setInput('')
                    }
                  }
                }}
              />
              <button
                type="submit"
                className="send"
                disabled={!input.trim()}
                aria-label="Send"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </form>
      </div>
      <CreateChat open={open} setOpen={setOpen} />
    </>
  )
}
