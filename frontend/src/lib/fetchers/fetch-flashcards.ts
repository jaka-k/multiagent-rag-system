'use client'

import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth'
import { logger } from '@lib/logger.ts'
import { updateSession } from '@lib/session/session.ts'
import type {
  Flashcard,
  FlashcardHandler,
  FlashcardQueue
} from '@mytypes/types'

export const getFlashcards = async (chatId: string) => {
  const response = await fetchWithAuth<FlashcardQueue>(
    `/api/flashcard-queue/${chatId}`
  )

  if (!response.ok) {
    logger.error(`Failed to fetch FlashcardQueue for chat: ${chatId}`)
  }

  if (response.refreshedToken) {
    await updateSession(response.refreshedToken)
  }

  return response.data
}

export const getSingleFlashcard = async (flashcardId: string) => {
  const response = await fetchWithAuth<Flashcard>(
    `/api/flashcard/${flashcardId}`
  )

  if (!response.ok) {
    logger.error('Error while fetching flashcard data')
  }

  if (response.refreshedToken) {
    await updateSession(response.refreshedToken)
  }

  return response.data
}

export const addFlashcard = async (id: string, areaId: string) => {
  const response = await fetchWithAuth<FlashcardHandler>(
    `/api/flashcard/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        area_id: areaId
      })
    }
  )

  if (!response.ok) {
    logger.error('Failed to add flashcard')
  }

  if (response.refreshedToken) {
    await updateSession(response.refreshedToken)
  }

  return response.data
}

export const deleteFlashcard = async (id: string) => {
  const response = await fetchWithAuth<FlashcardHandler>(
    `/api/flashcard/${id}`,
    {
      method: 'DELETE'
    }
  )

  if (!response.ok) {
    logger.error('Failed to delete flashcard')
  }

  if (response.refreshedToken) {
    await updateSession(response.refreshedToken)
  }

  return response.data
}
