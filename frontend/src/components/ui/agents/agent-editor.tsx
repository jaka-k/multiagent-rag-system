'use client'

import { Agent } from '@mytypes/types'
import React from 'react'

export default function AgentEditor({
  agent,
  onSave,
  onPatch,
  onDelete
}: {
  agent: Agent | null
  onSave: (systemPrompt: string) => Promise<void>
  onPatch: (patch: { cardType?: string; difficulty?: string }) => void
  onDelete: () => void
}) {
  const [prompt, setPrompt] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setPrompt(agent?.systemPrompt ?? '')
  }, [agent])

  return (
    <div className="editor">
      <div className="editor-head">
        <h3>{agent ? agent.name : 'Select an agent'}</h3>
        {agent && <span className="es">{agent.cardType}</span>}
      </div>
      <div className="editor-body">
        <div className="field">
          <div className="flbl">
            Instructions <span className="hint">system prompt</span>
          </div>
          <textarea
            className="ta mono"
            rows={8}
            value={prompt}
            disabled={!agent}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        {agent && (
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
          >
            <div className="field">
              <div className="flbl">Card format</div>
              <select
                className="sel"
                value={agent.cardType}
                onChange={(e) => onPatch({ cardType: e.target.value })}
              >
                {['def', 'code', 'concept', 'cloze'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <div className="flbl">Difficulty</div>
              <select
                className="sel"
                value={agent.difficulty ?? 'Standard'}
                onChange={(e) => onPatch({ difficulty: e.target.value })}
              >
                {['Standard', 'Hard'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        {agent && (agent.variables ?? []).length > 0 && (
          <div className="field">
            <div className="flbl">Variables</div>
            <div className="varrow">
              {(agent.variables ?? []).map((v) => (
                <span key={v} className="var">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="editor-foot">
        <button
          type="button"
          className="btn btn-pri"
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={!agent || saving}
          onClick={async () => {
            setSaving(true)
            await onSave(prompt)
            setSaving(false)
          }}
        >
          Save
        </button>
        {agent && (
          <button type="button" className="btn btn-ghost" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
