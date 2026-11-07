'use client'

import { Message } from '@mytypes/types'

import MarkdownContent from './markdown-content'

export default function MessageRow({ message }: { message: Message }) {
  if (message.content.length === 0) {
    return <div className="thinking">Thinking…</div>
  }

  const isUser = message.role === 'user'

  return (
    <div className={`msg ${isUser ? 'user' : 'bot'}`}>
      <div className="who">{isUser ? 'You' : 'AI'}</div>
      <div className="body">
        {isUser ? (
          <div className="bubble-user">{message.content}</div>
        ) : (
          <MarkdownContent className="prose chat-code">
            {message.content}
          </MarkdownContent>
        )}
      </div>
    </div>
  )
}
