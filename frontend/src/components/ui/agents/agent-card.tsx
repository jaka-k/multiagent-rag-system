'use client'

import { Agent } from '@mytypes/types'
import { Bot, Braces, FileQuestion, Lightbulb } from 'lucide-react'
import React from 'react'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  def: <FileQuestion size={18} />,
  code: <Braces size={18} />,
  concept: <Lightbulb size={18} />,
  cloze: <Bot size={18} />
}

const TYPE_COLORS: Record<string, string> = {
  def: 'var(--cb-blue-wash)',
  code: 'var(--purple-wash)',
  concept: 'var(--amber-wash)',
  cloze: 'var(--green-wash)'
}

export default function AgentCard({
  agent,
  selected,
  onSelect,
  onToggle
}: {
  agent: Agent
  selected: boolean
  onSelect: () => void
  onToggle: () => void
}) {
  return (
    <div
      className={selected ? 'agent on' : 'agent'}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="agent-top">
        <div
          className="agent-ico"
          style={{ background: TYPE_COLORS[agent.cardType] ?? 'var(--subtle)' }}
        >
          {TYPE_ICONS[agent.cardType] ?? <Bot size={18} />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3>{agent.name}</h3>
          <div className="ad">{agent.description}</div>
        </div>
        <button
          type="button"
          className={agent.isActive ? 'tog on' : 'tog'}
          aria-label="Toggle agent"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
        >
          <i />
        </button>
      </div>
      <div className="agent-meta">
        <span className="tagk">{agent.cardType}</span>
        <span className="tagk">{agent.model ?? 'default model'}</span>
        {agent.difficulty && (
          <span className="tagk" style={{ marginLeft: 'auto' }}>
            {agent.difficulty}
          </span>
        )}
      </div>
    </div>
  )
}
