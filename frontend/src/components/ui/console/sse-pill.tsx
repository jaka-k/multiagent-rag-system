'use client'

import { useSSE } from '@hooks/use-sse.tsx'
import { getSingleFlashcard } from '@lib/fetchers/fetch-flashcards.ts'
import { StatusIndicator } from '@ui/status-indicator.tsx'
import { useMemo } from 'react'
import useConsoleStore from '@context/console-store.tsx'
import { getSingleChapter } from '@lib/fetchers/fetch-chapters.ts'

const SSEPill = ({ chatId }: { chatId: string }) => {
  const { addChapter } = useConsoleStore()

  const { isConnected } = useSSE({
    chatId,
    onFlashcardUpdate: useMemo(
      () => async (flashcardIds) => {
        for (const id of flashcardIds) {
          console.log(id)
          const flashcard = await getSingleFlashcard(id)
          // TODO Here optimistic update
          // setFlashcards((prev) => [...prev, flashcard])
        }
      },
      []
    ),
    onDocumentUpdate: useMemo(
      () => async (documentIds) => {
        console.log('Document Update:', documentIds)
        for (const tag of documentIds) {
          const { chapter } = await getSingleChapter(tag)
          addChapter(chatId, chapter)
        }
      },
      []
    )
  })

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">SSE Connection Status:</span>
      <StatusIndicator isConnected={isConnected} />
    </div>
  )
}

export default SSEPill
