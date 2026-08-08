'use client'

import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth'
import { logger } from '@lib/logger'
import type { Chapter, ChapterQueue } from '@mytypes/types'

export const getChapterQueue = async (chatId: string) => {
  const response = await fetchWithAuth<ChapterQueue>(
    `/api/chapter-queue/${chatId}`
  )

  if (!response.ok) {
    logger.error(`Failed to fetch ChapterQueue for chat: ${chatId}`)
  }

  return response.data
}

export const getSingleChapter = async (chapterTag: string) => {
  const response = await fetchWithAuth<{ chapter: Chapter }>(
    `/api/chapter?chapter_tag=${encodeURIComponent(chapterTag)}`
  )

  if (!response.ok) {
    logger.error('Error while fetching chapter data')
  }

  return response.data
}
