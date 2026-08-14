'use client'

import { Message } from '@mytypes/types'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

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
          <Markdown
            rehypePlugins={[rehypeHighlight]}
            className="prose chat-code"
          >
            {message.content}
          </Markdown>
        )}
      </div>
    </div>
  )
}
