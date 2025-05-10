'use client'

import { useFlashcards } from '@hooks/use-flashcards.tsx'
import FlashcardItem from '@ui/flashcards/flashcard-item'
import { LibraryBig } from 'lucide-react'
import * as React from 'react'

interface FlashcardListProps {
  chatId: string
  areaId: string
}

function FlashcardList({ chatId, areaId }: FlashcardListProps) {
  const { optimisticFlashcards, handleAddFlashcard, handleDeleteFlashcard } =
    useFlashcards(chatId, areaId)

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      {optimisticFlashcards.length > 0 ? (
        optimisticFlashcards?.map((flashcard) => (
          <FlashcardItem
            key={flashcard.id}
            flashcard={flashcard}
            onAddFlashcard={handleAddFlashcard}
            onDeleteFlashcard={handleDeleteFlashcard}
          />
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground ">
          <LibraryBig className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No flashcards in queue</p>
          <p className="text-xs mt-1">
            Once you start interacting with the chat, the flashcard agent will
            create them in the background
          </p>
        </div>
      )}
    </div>
  )
}

export default FlashcardList
