'use client'

import { Send } from 'lucide-react'
import React from 'react'

export default function Composer({
  onSubmit
}: {
  onSubmit: (text: string) => void
}) {
  const [input, setInput] = React.useState('')

  function submit() {
    if (!input.trim()) return
    onSubmit(input)
    setInput('')
  }

  return (
    <div className="composer-wrap">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
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
                  submit()
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
  )
}
