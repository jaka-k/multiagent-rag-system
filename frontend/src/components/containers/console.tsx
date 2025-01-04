/* eslint-disable no-console */

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs'
import { cn } from '@lib/utils'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { Bot, Club, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import ChapterViewer from '@ui/chapter-viewer/chapter-viewer'
import FlashcardList from '@ui/flashcards/flashcard-list'
import FlashcardCreator from '@ui/flashcard-creator/flashcard-creator'
import { useFlashcards } from '@hooks/use-flashcards'

const Console = ({ chatId, areaId }: { chatId: string; areaId: string }) => {
  const [isConnected, setIsConnected] = useState(false)
  const {
    optimisticFlashcards,
    setFlashcards,
    handleAddFlashcard,
    handleDeleteFlashcard
  } = useFlashcards(chatId, areaId)

  useEffect(() => {
    const controller = new AbortController()

    const connectSSE = async () => {
      await fetchEventSource(`http://localhost:8080/api/events/${chatId}`, {
        signal: controller.signal,
        async onopen(response) {
          if (
            response.ok &&
            response.headers.get('content-type') === 'text/event-stream'
          ) {
            console.log('EventSource connected')
            setIsConnected(true)
          } else if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ) {
            throw new Error('Fatal error')
          } else {
            throw new Error('Retriable error')
          }
        },
        onmessage(event) {
          console.log(event)
          if (event.event === 'flashcard') {
            const data: string[] = JSON.parse(event.data)
            console.log('Flashcards Updated via SSE:', data)

            // Option 1: Re-fetch everything:
            // refetchAllFlashcards()

            // Option 2: Partial update:
            // setFlashcards((prev) => [...prev, data])
            // Make sure to check for duplicates if needed
          }

          if (event.event === 'document') {
            const data: string[] = JSON.parse(event.data)
            console.log('Document Updated via SSE:', data)
          }
        },
        onclose() {
          console.log('SSE closed, retrying...')
          setIsConnected(false)
          throw new Error('Connection closed')
        },
        onerror(err) {
          console.error('SSE error:', err)
          if (err.message === 'Fatal error') {
            throw err
          }
        }
      })
    }

    connectSSE().catch((err) => {
      // TODO: log
      console.log(err)
    })

    return () => {
      controller.abort()
      console.log('SSE cleanup')
      setIsConnected(false)
    }
  }, [chatId])

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
            <div
              className={cn(
                'text-xs font-medium px-2 py-1 rounded-md',
                isConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              )}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </header>
        {/* You could add more small status indicators here */}
      </div>

      {/* ------------- Another "Bento" Card for Tabs ------------- */}
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
