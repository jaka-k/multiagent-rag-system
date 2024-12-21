import { Card } from '@components/ui/card'
import { Flashcard } from '@types'
import { BadgeMinus, BadgePlus } from 'lucide-react'

interface FlashcardItemProps {
  flashcard: Flashcard
  onAddFlashcard: (id: string) => Promise<void>
  onDeleteFlashcard: (id: string) => Promise<void>
}

function FlashcardItem({
  flashcard,
  onAddFlashcard,
  onDeleteFlashcard
}: FlashcardItemProps) {
  const handleDelete = async () => {
    // You could also do an optimistic removal in the parent if you prefer
    await onDeleteFlashcard(flashcard.id)
  }

  const handleAdd = async () => {
    // You could also do an optimistic removal in the parent if you prefer
    await onAddFlashcard(flashcard.id)
  }

  return (
    <Card className="relative p-4 bg-slate-50 text-sm">
      {/* ------------- Action Buttons ------------- */}
      <div className="absolute top-2 right-2 flex space-x-1">
        <button onClick={handleDelete} className="active:animate-ping">
          <BadgeMinus
            className="hover:fill-red-300 hover:stroke-red-800"
            size={18}
            strokeWidth="1.25px"
          />
        </button>

        <button onClick={handleAdd} className="active:animate-ping">
          <BadgePlus
            className="hover:fill-green-300 hover:stroke-green-800"
            size={18}
            strokeWidth="1.25px"
          />
        </button>
      </div>

      {/* ------------- Front ------------- */}
      <p className="mb-1 text-slate-500 text-xs">front:</p>
      <Card className="p-4 text-wrap text-slate-700">
        <div
          className="overflow-x-clip"
          dangerouslySetInnerHTML={{
            __html: flashcard.front
          }}
        />
      </Card>

      {/* ------------- Back ------------- */}
      <p className="mt-3 mb-1 text-slate-500 text-xs">back:</p>
      <Card className="p-4 text-wrap text-slate-700">
        <div
          className="overflow-x-clip"
          dangerouslySetInnerHTML={{
            __html: flashcard.back
          }}
        />
      </Card>
    </Card>
  )
}

export default FlashcardItem
