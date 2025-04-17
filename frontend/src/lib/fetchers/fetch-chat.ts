import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth'
import { ChatData } from '@mytypes/types'

export async function createChat(title: string, areaId: string) {
  const response = await fetchWithAuth<ChatData>('/api/create-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      area_id: areaId
    })
  })

  if (!response.ok) {
    throw new Error('Failed to create chat')
  }

  return response.data
}

export async function getAllChats() {
  const response = await fetchWithAuth<ChatData[]>('/api/me/chats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to create chat')
  }

  return response.data
}
