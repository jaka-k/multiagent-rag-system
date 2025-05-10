'use client'

import useConsoleStore from '@context/console-store.tsx'
import { useFlashcards } from '@hooks/use-flashcards.tsx'
import { useSSE } from '@hooks/use-sse.tsx'
import { getSingleChapter } from '@lib/fetchers/fetch-chapters.ts'
import { getSingleFlashcard } from '@lib/fetchers/fetch-flashcards.ts'
import { Flashcard } from '@mytypes/types'
import { StatusIndicator } from '@ui/status-indicator.tsx'
import { useCallback } from 'react'

const SSEPill = ({ chatId, areaId }: { chatId: string; areaId: string }) => {
  const { addChapter } = useConsoleStore()
  const { setFlashcards } = useFlashcards(chatId, areaId)

  function pushFlashcard(flashcard: Flashcard) {
    useConsoleStore.getState().addFlashcard(chatId, flashcard)
    setFlashcards((prev) => [...prev, flashcard])
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
