'use client'



import { Button } from '@components/ui/button'
import { logger } from '@lib/logger.ts'
import { cn, connectionStatusMapping } from '@lib/utils'
import { ChatData, Message } from '@mytypes/types'
import CreateChat from '@ui/create-chat/create-chat.tsx'
import { Textarea } from '@ui/textarea'
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

  const [messages, setMessages] = React.useState<Message[]>(
    chatData.messages ?? []
  )
  const [input, setInput] = React.useState('')
  const inputLength = input.trim().length

  // auto-scroll ref
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight
    }
  }, [messages])

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

      // if last message not from agent, return as is (unlikely, but safe)
      return prevMessages
    })
  }

  // TODO: Combine both the appendFuncs
  const appendMetadataMessage = (metadata: string) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1]

      if (lastMessage.role === 'agent') {
        return [
          ...prevMessages.slice(0, prevMessages.length - 1),
          {
            ...lastMessage,
            metadata: JSON.stringify(metadata)
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
        } else if (messageData.metadata) {
          appendMetadataMessage(messageData.metadata)
        }
      } catch (error) {
        logger.error('Error parsing WebSocket message:', error)
      }
    },
    onClose: () => {},
    shouldReconnect: () => true
  })
  const connectionStatus = connectionStatusMapping(readyState)

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputLength === 0) return
    setMessages([
      ...messages,
      {
        role: 'user',
        content: input
      },
      {
        role: 'agent',
        content: ''
      }
    ])
    sendMessage(input)
    setInput('')
  }

  return (
    <div className="w-full h-full p-4 overflow-hidden">
      <div className="relative flex flex-col w-full h-full bg-white rounded-lg shadow-lg">
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <div className="text-sm font-semibold">{chatData.title}</div>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-md',
                connectionStatus === 'Open'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              )}
            >
              {connectionStatus === 'Open' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </header>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        >
          {messages.map((msg, idx) =>
            msg.content.length === 0 ? (
              <div key={idx} className="flex justify-center">
                <span className="text-sm text-gray-400 animate-pulse">
                  Agent is thinking...
                </span>
              </div>
            ) : (
              <Markdown
                key={idx}
                rehypePlugins={[rehypeHighlight]}
                className={cn(
                  'chat-code w-fit max-w-[70%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap shadow-sm',
                  msg.role === 'user'
                    ? 'ml-auto bg-cyan-800 text-white'
                    : 'bg-gray-100 text-gray-800'
                )}
              >
                {msg.content}
              </Markdown>
            )
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center space-x-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
            />
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
      <CreateChat open={open} setOpen={setOpen} />
    </div>
  )
}
