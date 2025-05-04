'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs'
import useAreaStore from '@context/area-store.tsx'
import useConsoleStore from '@context/console-store.tsx'
import ChapterViewer from '@ui/console/chapter-viewer.tsx'
import SSEPill from '@ui/console/sse-pill'
import FlashcardCreator from '@ui/flashcard-creator/flashcard-creator'
import FlashcardList from '@ui/flashcards/flashcard-list'
import { Bot, Club, FileText } from 'lucide-react'
import { useEffect } from 'react'
import FeatureOverlay from '@ui/feature-overlay.tsx'

const Console = ({ chatId, areaId }: { chatId: string; areaId: string }) => {
  const { setActiveArea } = useAreaStore.getState()
  const { fetchConsoleQueues, setCurrentConsole } = useConsoleStore.getState()
  useEffect(() => {
    console.log(areaId)
    setActiveArea(areaId)
    setCurrentConsole(chatId)
    fetchConsoleQueues(chatId)
  }, [chatId])

  return (
    <section className="h-full w-full overflow-y-auto px-2 py-4">
      {/* ------------- "Bento" Card Container ------------- */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <header className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Console</h2>
          <SSEPill chatId={chatId} />
        </header>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-4 ">
        <Tabs defaultValue="flashcards">
          <TabsList
            className="
      inline-flex items-center
      bg-gray-100
      p-1
      py-6
      rounded-lg
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
        rounded-lg
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
        rounded-lg
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
        rounded-lg
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
            <ChapterViewer chatId={chatId} />
          </TabsContent>

          <TabsContent value="flashcards">
            <FlashcardList chatId={chatId} areaId={areaId} />
          </TabsContent>
          <TabsContent value="creator">
            <FeatureOverlay>
              <FlashcardCreator />
            </FeatureOverlay>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

export default Console
