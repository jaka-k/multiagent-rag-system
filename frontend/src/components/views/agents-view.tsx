'use client'

import useAreaStore from '@context/area-store.tsx'
import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import { Bot, Braces, FileQuestion, Lightbulb, Plus } from 'lucide-react'
import React from 'react'

interface AgentDto {
  id: string
  areaId: string
  name: string
  description: string
  icon: string
  cardType: string
  systemPrompt: string
  variables: string[]
  isActive: boolean
  difficulty: string | null
}

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

export default function AgentsView() {
  const { activeArea } = useAreaStore()
  const [agentList, setAgentList] = React.useState<AgentDto[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [prompt, setPrompt] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const selected = agentList.find((a) => a.id === selectedId) ?? null

  const load = React.useCallback(async () => {
    if (!activeArea) return
    const r = await fetchWithAuth<AgentDto[]>(
      `/api/area/${activeArea.id}/agents`,
      { method: 'GET' }
    )

    if (r.ok) setAgentList(r.data)
  }, [activeArea])

  React.useEffect(() => {
    load()
  }, [load])

  React.useEffect(() => {
    setPrompt(selected?.systemPrompt ?? '')
  }, [selected])

  async function createAgent() {
    if (!activeArea) return
    const r = await fetchWithAuth<AgentDto>('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        areaId: activeArea.id,
        name: `New agent ${agentList.length + 1}`,
        description: 'Describe what this agent cards',
        cardType: 'def',
        variables: ['{{chapter}}', '{{selection}}']
      }
    })

    if (r.ok) {
      await load()
      setSelectedId(r.data.id)
    }
  }

  async function patchAgent(id: string, body: Record<string, unknown>) {
    await fetchWithAuth(`/api/agents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body
    })
    await load()
  }

  return (
    <div className="page scroll fade">
      <div className="page-inner">
        <div className="sec-head">
          <h2>Agent Instructions</h2>
          <span className="desc">
            Card-generation agents for {activeArea?.name ?? '—'}
          </span>
          <div className="right">
            <button type="button" className="btn btn-pri" onClick={createAgent}>
              <Plus size={15} />
              New agent
            </button>
          </div>
        </div>

        <div className="agents-layout">
          <div className="agrid">
            {agentList.map((agent) => (
              <div
                key={agent.id}
                className={agent.id === selectedId ? 'agent on' : 'agent'}
                onClick={() => setSelectedId(agent.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedId(agent.id)}
                role="button"
                tabIndex={0}
              >
                <div className="agent-top">
                  <div
                    className="agent-ico"
                    style={{
                      background: TYPE_COLORS[agent.cardType] ?? 'var(--subtle)'
                    }}
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
                      patchAgent(agent.id, { isActive: !agent.isActive })
                    }}
                  >
                    <i />
                  </button>
                </div>
                <div className="agent-meta">
                  <span className="tagk">{agent.cardType}</span>
                  {agent.difficulty && (
                    <span className="tagk">{agent.difficulty}</span>
                  )}
                </div>
              </div>
            ))}
            {agentList.length === 0 && (
              <div className="empty-hint" style={{ gridColumn: '1 / -1' }}>
                No agents in this area yet — create one to start routing cards.
              </div>
            )}
          </div>

          <div className="editor">
            <div className="editor-head">
              <h3>{selected ? selected.name : 'Select an agent'}</h3>
              {selected && <span className="es">{selected.cardType}</span>}
            </div>
            <div className="editor-body">
              <div className="field">
                <div className="flbl">System prompt</div>
                <textarea
                  className="ta"
                  rows={8}
                  value={prompt}
                  disabled={!selected}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              {selected && selected.variables.length > 0 && (
                <div className="field">
                  <div className="flbl">Variables</div>
                  <div className="varrow">
                    {selected.variables.map((v) => (
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
                disabled={!selected || saving}
                onClick={async () => {
                  if (!selected) return
                  setSaving(true)
                  await patchAgent(selected.id, { systemPrompt: prompt })
                  setSaving(false)
                }}
              >
                Save
              </button>
              {selected && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={async () => {
                    await fetchWithAuth(`/api/agents/${selected.id}`, {
                      method: 'DELETE'
                    })
                    setSelectedId(null)
                    await load()
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
