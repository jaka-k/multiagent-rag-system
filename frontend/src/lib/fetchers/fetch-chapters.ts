'use client'

import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth'
import { logger } from '@lib/logger'
import { updateSession } from '@lib/session/session'
import type { Chapter, ChapterQueue } from '@mytypes/types'

export const getChapterQueue = async (chatId: string) => {
  const response = await fetchWithAuth<ChapterQueue>(
    `/api/chapter-queue/${chatId}`
  )

  if (!response.ok) {
    logger.error(`Failed to fetch ChapterQueue for chat: ${chatId}`)
  }

  if (response.refreshedToken) {
    await updateSession(response.refreshedToken)
  }

  return response.data
}

export const getSingleChapter = async (chapterTag: string) => {
  const response = await fetchWithAuth<{ chapter: Chapter }>(`/api/chapter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ chapter_tag: chapterTag })
  })

  if (!response.ok) {
    logger.error('Error while fetching chapter data')
  }

  if (response.refreshedToken) {
    await updateSession(response.refreshedToken)
  }

  return response.data
}
