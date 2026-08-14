'use client'

import { areaDotColor } from '@components/shell/rail'
import { Area } from '@mytypes/types'
import { Send } from 'lucide-react'
import React from 'react'

export default function Launcher({
  area,
  onLaunch
}: {
  area: Area | null
  onLaunch: (prompt: string) => Promise<void>
}) {
  const [prompt, setPrompt] = React.useState('')
  const [creating, setCreating] = React.useState(false)

  async function launch() {
    if (!prompt.trim() || !area || creating) return
    setCreating(true)

    try {
      await onLaunch(prompt.trim())
    } finally {
      setCreating(false)
    }
  }

  return (
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
            style={{ background: area ? areaDotColor(area.id) : '#666' }}
          />
          {area?.name ?? 'No area selected'}
        </span>
      </div>
    </div>
  )
}
