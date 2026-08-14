'use client'

import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth'
import { logger } from '@lib/logger.ts'
import type { Agent } from '@mytypes/types'

export const getAgents = async (areaId: string) => {
  const response = await fetchWithAuth<Agent[]>(`/api/area/${areaId}/agents`, {
    method: 'GET'
  })

  if (!response.ok) {
    logger.error(`Failed to fetch agents for area: ${areaId}`)

    return []
  }

  return response.data
}

export const createAgent = async (areaId: string, name: string) => {
  const response = await fetchWithAuth<Agent>('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      areaId,
      name,
      description: 'Describe what this agent cards',
      cardType: 'def',
      variables: ['{{chapter}}', '{{selection}}']
    }
  })

  if (!response.ok) {
    logger.error('Failed to create agent')

    return null
  }

  return response.data
}

export const updateAgent = async (
  agentId: string,
  patch: Partial<
    Pick<Agent, 'systemPrompt' | 'isActive' | 'cardType' | 'difficulty'>
  >
) => {
  const response = await fetchWithAuth<Agent>(`/api/agents/${agentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: patch
  })

  if (!response.ok) logger.error(`Failed to update agent: ${agentId}`)

  return response.ok
}

export const deleteAgent = async (agentId: string) => {
  const response = await fetchWithAuth(`/api/agents/${agentId}`, {
    method: 'DELETE'
  })

  if (!response.ok) logger.error(`Failed to delete agent: ${agentId}`)

  return response.ok
}
