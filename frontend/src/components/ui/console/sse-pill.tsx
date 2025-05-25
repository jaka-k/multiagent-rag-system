'use client'

import useConsoleStore from '@context/console-store.tsx'
import { useSSE } from '@hooks/use-sse.tsx'
import { getSingleChapter } from '@lib/fetchers/fetch-chapters.ts'
import { getSingleFlashcard } from '@lib/fetchers/fetch-flashcards.ts'
import { Flashcard } from '@mytypes/types'
import { StatusIndicator } from '@ui/status-indicator.tsx'
import { useCallback } from 'react'

const SSEPill = ({ chatId }: { chatId: string }) => {
  const { addChapter } = useConsoleStore()
  const { addFlashcard } = useConsoleStore()

  function pushFlashcard(flashcard: Flashcard) {
    addFlashcard(chatId, flashcard)
  }

  const onFlashcardUpdate = useCallback(
    async (flashcardIds: string[]) => {
      await Promise.all(
        flashcardIds.map(async (id) => {
          const flashcard = await getSingleFlashcard(id)
          pushFlashcard(flashcard)
        })
      )
    },
    [pushFlashcard]
  )

  const onDocumentUpdate = useCallback(
    async (documentIds: string[]) => {
      await Promise.all(
        documentIds.map(async (tag) => {
          const { chapter } = await getSingleChapter(tag)
          addChapter(chatId, chapter)
        })
      )
    },
    [chatId, addChapter]
  )

  const { isConnected } = useSSE({
    chatId,
    onFlashcardUpdate,
    onDocumentUpdate
  })

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">SSE Connection Status:</span>
      <StatusIndicator isConnected={isConnected} />
    </div>
  )
}

export default SSEPill
