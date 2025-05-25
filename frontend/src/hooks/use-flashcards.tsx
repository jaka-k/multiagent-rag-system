'use client'

import useConsoleStore from '@context/console-store.tsx'
import { useToast } from '@hooks/use-toast.ts'
import {
  addFlashcard,
  deleteFlashcard
} from '@lib/fetchers/fetch-flashcards.ts'
import { logger } from '@lib/logger.ts'
import { Flashcard } from '@mytypes/types'
import { startTransition, useOptimistic } from 'react'

interface UseFlashcardsReturn {
  optimisticFlashcards: Flashcard[]
  handleAddFlashcard: (id: string) => Promise<void>
  handleDeleteFlashcard: (id: string) => Promise<void>
}

export function useFlashcards(
  chatId: string,
  areaId: string
): UseFlashcardsReturn {
  const { toast } = useToast()

  const flashcards = useConsoleStore(
    (s) => s.consolesByChat[chatId]?.flashcardQueue?.flashcards ?? []
  )
  const removeFlashcardFromStore = useConsoleStore((s) => s.removeFlashcard)

  const [optimisticFlashcards, applyOptimistic] = useOptimistic(
    flashcards,
    (prev: Flashcard[], fid: string) => prev.filter((fc) => fc.id !== fid)
  )

  async function handleAddFlashcard(id: string) {
    startTransition(() => applyOptimistic(id))

    try {
      const result = await addFlashcard(id, areaId)

      if (result.id !== id) {
        logger.warn(`Flashcard ${id} was not confirmed in backend`)
        toast({
          title: 'Ups something went wrong! 🫣',
          description: `Flashcard ${id} was not confirmed in backend`
        })
      } else {
        removeFlashcardFromStore(chatId, id)
      }
    } catch (err) {
      logger.error(`Failed to add flashcard ${id}:`, err)

      toast({
        title: 'Something went wrong! 📛',
        description:
          'We could not commit your flashcard to the deck. Reloading...'
      })
      useConsoleStore.getState().fetchConsoleQueues(chatId)
    }
  }

  async function handleDeleteFlashcard(id: string) {
    startTransition(() => applyOptimistic(id))

    try {
      const result = await deleteFlashcard(id)

      if (result.id !== id) {
        logger.warn(`Flashcard ${id} was not deleted in backend`)
        toast({
          title: 'Ups something went wrong! 🫣',
          description: `Flashcard ${id} was not confirmed in backend`
        })
      } else {
        removeFlashcardFromStore(chatId, id)
      }
    } catch (err) {
      logger.error(`Failed to delete flashcard ${id}:`, err)

      toast({
        title: 'Something went wrong! 📛',
        description:
          'We could not delete your flashcard in the backend. Reloading...'
      })
      useConsoleStore.getState().fetchConsoleQueues(chatId)
    }
  }

  return {
    optimisticFlashcards,
    handleAddFlashcard,
    handleDeleteFlashcard
  }
}
