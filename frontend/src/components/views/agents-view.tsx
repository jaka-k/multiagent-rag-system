'use client'

import useAreaStore from '@context/area-store.tsx'
import {
  createAgent,
  deleteAgent,
  getAgents,
  updateAgent
} from '@lib/fetchers/fetch-agents.ts'
import { Agent } from '@mytypes/types'
import AgentCard from '@ui/agents/agent-card'
import AgentEditor from '@ui/agents/agent-editor'
import { Plus } from 'lucide-react'
import React from 'react'

export default function AgentsView() {
  const { activeArea } = useAreaStore()
  const [agents, setAgents] = React.useState<Agent[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const selected = agents.find((a) => a.id === selectedId) ?? null

  const load = React.useCallback(async () => {
    if (activeArea) setAgents(await getAgents(activeArea.id))
  }, [activeArea])

  React.useEffect(() => {
    load()
  }, [load])

  async function handleCreate() {
    if (!activeArea) return
    const agent = await createAgent(
      activeArea.id,
      `New agent ${agents.length + 1}`
    )

    if (agent) {
      await load()
      setSelectedId(agent.id)
    }
  }

  async function handlePatch(
    id: string,
    patch: Parameters<typeof updateAgent>[1]
  ) {
    await updateAgent(id, patch)
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
            <button
              type="button"
              className="btn btn-pri"
              onClick={handleCreate}
            >
              <Plus size={15} />
              New agent
            </button>
          </div>
        </div>

        <div className="agents-layout">
          <div className="agrid">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={agent.id === selectedId}
                onSelect={() => setSelectedId(agent.id)}
                onToggle={() =>
                  handlePatch(agent.id, { isActive: !agent.isActive })
                }
              />
            ))}
            {agents.length === 0 && (
              <div className="empty-hint" style={{ gridColumn: '1 / -1' }}>
                No agents in this area yet — create one to start routing cards.
              </div>
            )}
          </div>

          <AgentEditor
            agent={selected}
            onSave={async (systemPrompt) => {
              if (selected) await handlePatch(selected.id, { systemPrompt })
            }}
            onPatch={(patch) => selected && handlePatch(selected.id, patch)}
            onDelete={async () => {
              if (!selected) return
              await deleteAgent(selected.id)
              setSelectedId(null)
              await load()
            }}
          />
        </div>
      </div>
    </div>
  )
}
