'use client'

import {
  addFlashcard,
  deleteFlashcard,
  getFlashcards
} from '@lib/fetchers/fetch-flashcards.ts'
import { Flashcard } from '@mytypes/types'
import React, {
  startTransition,
  useEffect,
  useOptimistic,
  useState
} from 'react'

interface UseFlashcardsReturn {
  optimisticFlashcards: Flashcard[]
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>
  handleAddFlashcard: (id: string) => Promise<void>
  handleDeleteFlashcard: (id: string) => Promise<void>
}

/**
 * Custom hook for:
 *  - Initial fetch of flashcards
 *  - Optimistic updates for add/delete
 *
 * SSE is handled outside this hook,
 * so we do NOT subscribe to SSE here.
 */
export function useFlashcards(
  chatId: string,
  areaId: string
): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [optimisticFlashcards, addOptimisticUpdate] = useOptimistic(
    flashcards,
    (prev: Flashcard[], fid: string) => prev.filter((fc) => fc.id !== fid)
  )

  useEffect(() => {
    async function fetchFlashcardsData() {
      const data = await getFlashcards(chatId)
      setFlashcards(data.flashcards)
    }

    fetchFlashcardsData().catch((err) => {
      // TODO: log
      console.log(err)
    })
  }, [chatId])

  async function handleAddFlashcard(id: string) {
    startTransition(() => addOptimisticUpdate(id))
    const result = await addFlashcard(id, areaId)
    if (result.id === id) {
      setFlashcards((prev) => prev.filter((fc) => fc.id !== id))
    }
  }

  async function handleDeleteFlashcard(id: string) {
    startTransition(() => addOptimisticUpdate(id))
    const result = await deleteFlashcard(id)
    if (result.id === id) {
      setFlashcards((prev) => prev.filter((fc) => fc.id !== id))
    }
  }

  return {
    optimisticFlashcards,
    setFlashcards,
    handleAddFlashcard,
    handleDeleteFlashcard
  }
}
