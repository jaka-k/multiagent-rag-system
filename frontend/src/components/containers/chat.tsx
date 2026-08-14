'use client'

import useRetrievalStore from '@context/retrieval-store.tsx'
import { useChatSocket } from '@lib/sockets/use-chat-socket.ts'
import { WsContextChapter, WsErrorPayload } from '@lib/sockets/ws-protocol.ts'
import { ChatData, Message } from '@mytypes/types'
import CreateChat from '@ui/create-chat/create-chat.tsx'
import { ArrowLeft, Plus, Send } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { useEffect, useRef } from 'react'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

export function Chat({ chatData }: { chatData: ChatData }) {
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
