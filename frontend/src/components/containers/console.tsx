/* eslint-disable no-console */

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs'
import { useFlashcards } from '@hooks/use-flashcards'
import { useSSE } from '@hooks/use-sse'
import { getSingleFlashcard } from '@lib/fetchers/fetch-flashcards.ts'
import ChapterViewer from '@ui/chapter-viewer/chapter-viewer'
import FlashcardCreator from '@ui/flashcard-creator/flashcard-creator'
import FlashcardList from '@ui/flashcards/flashcard-list'
import { StatusIndicator } from '@ui/status-indicator'
import { Bot, Club, FileText } from 'lucide-react'
import { useMemo } from 'react'

const Console = ({ chatId, areaId }: { chatId: string; areaId: string }) => {
  const {
    optimisticFlashcards,
    setFlashcards,
    handleAddFlashcard,
    handleDeleteFlashcard
  } = useFlashcards(chatId, areaId)

  const { isConnected } = useSSE({
    chatId,
    onFlashcardUpdate: useMemo(
      () => async (flashcardIds) => {
        for (const id of flashcardIds) {
          console.log(id)
          const flashcard = await getSingleFlashcard(id)
          setFlashcards((prev) => [...prev, flashcard])
        }
      },
      []
    ),
    onDocumentUpdate: useMemo(
      () => (documentIds) => {
        console.log('Document Update:', documentIds)
      },
      []
    )
  })

  return (
    <section className="h-full w-full overflow-y-auto px-2 py-4">
      {/* ------------- "Bento" Card Container ------------- */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <header className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Console</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              SSE Connection Status:
            </span>
            <StatusIndicator isConnected={isConnected} />
          </div>
        </header>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-4 ">
        <Tabs defaultValue="flashcards">
          <TabsList
            className="
      inline-flex items-center 
      bg-gray-100 
      p-1
      rounded-full
      gap-1
      w-full
      justify-around
    "
          >
            <TabsTrigger
              value="documents"
              className="
        flex items-center gap-1 px-3 py-1.5 
        text-sm font-medium text-gray-600 
        rounded-full 
        transition-colors
        data-[state=active]:bg-white
        data-[state=active]:text-gray-800
        data-[state=active]:shadow-sm
        hover:bg-gray-50
      "
            >
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>

            <TabsTrigger
              value="flashcards"
              className="
        flex items-center gap-1 px-3 py-1.5
        text-sm font-medium text-gray-600
        rounded-full
        transition-colors
        data-[state=active]:bg-white
        data-[state=active]:text-gray-800
        data-[state=active]:shadow-sm
        hover:bg-gray-50
      "
            >
              <Club className="h-4 w-4" />
              Flashcards
            </TabsTrigger>

            <TabsTrigger
              value="creator"
              className="
        flex items-center gap-1 px-3 py-1.5
        text-sm font-medium text-gray-600
        rounded-full
        transition-colors
        data-[state=active]:bg-white
        data-[state=active]:text-gray-800
        data-[state=active]:shadow-sm
        hover:bg-gray-50
      "
            >
              <Bot className="h-4 w-4" />
              Creator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <ChapterViewer />
          </TabsContent>

          <TabsContent value="flashcards">
            <FlashcardList
              flashcards={optimisticFlashcards}
              onAddFlashcard={handleAddFlashcard}
              onDeleteFlashcard={handleDeleteFlashcard}
            />
          </TabsContent>
          <TabsContent value="creator">
            <FlashcardCreator />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

export default Console
