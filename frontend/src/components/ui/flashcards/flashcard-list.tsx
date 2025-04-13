'use client'

import { useFlashcards } from '@hooks/use-flashcards.tsx'
import FlashcardItem from '@ui/flashcards/flashcard-item'

interface FlashcardListProps {
  chatId: string
  areaId: string
}

function FlashcardList({ chatId, areaId }: FlashcardListProps) {
  const {
    optimisticFlashcards,
    handleAddFlashcard,
    handleDeleteFlashcard
  } = useFlashcards(chatId, areaId)

  return (
    <div className="flex flex-col gap-4">
      {optimisticFlashcards?.map((flashcard) => (
        <FlashcardItem
          key={flashcard.id}
          flashcard={flashcard}
          onAddFlashcard={handleAddFlashcard}
          onDeleteFlashcard={handleDeleteFlashcard}
        />
      ))}
    </div>
  )
}

export default FlashcardList
