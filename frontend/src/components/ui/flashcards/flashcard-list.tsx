import { Flashcard } from '@mytypes/types'
import FlashcardItem from '@ui/flashcards/flashcard-item'

interface FlashcardListProps {
  flashcards: Flashcard[]
  onAddFlashcard: (id: string) => Promise<void>
  onDeleteFlashcard: (id: string) => Promise<void>
}

function FlashcardList({
  flashcards,
  onAddFlashcard,
  onDeleteFlashcard
}: FlashcardListProps) {

  return (
    <div className="flex flex-col gap-4">
      {flashcards?.map((flashcard) => (
        <FlashcardItem
          key={flashcard.id}
          flashcard={flashcard}
          onAddFlashcard={onAddFlashcard}
          onDeleteFlashcard={onDeleteFlashcard}
        />
      ))}
    </div>
  )
}

export default FlashcardList
