'use client'

import { Card } from '@components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs'
import { cn } from '@lib/utils'
import { BadgeMinus, BadgePlus, Bot, Club, FileText } from 'lucide-react'
import { useState } from 'react'

type Flashcard = {
  id: string
  front: string
  back: string
}

const Console = ({ chatId }: { chatId: string }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    {
      id: 'string',
      front: 'flex-shrink-0',
      back: 'This class restricts the shrinking feature, it has the ability of an item to shrink compared to content present inside the same container.'
    },
    {
      id: 'string',
      front: 'flex-shrink-0',
      back: 'This class restricts the shrinking feature, it has the ability of an item to shrink compared to content present inside the same container.'
    }
  ])
  const eventSource = new EventSource(
    `http://localhost:8080/flashcards-sse/${chatId}`
  )

  eventSource.onopen = () => {
    console.log('EventSource connected')
    setIsConnected(true)
  }

  // eventSource can have event listeners based on the type of event.
  // Bydefault for message type of event it have the onmessage method which can be used directly or this same can be achieved through explicit eventlisteners
  eventSource.addEventListener('flashcardsUpdate', (event) => {
    const data: Flashcard = JSON.parse(event.data)
    setFlashcards((prev) => [...prev, data])
    console.log('FlashcardUpdated', flashcards)
  })

  // In case of any error, if eventSource is not closed explicitely then client will retry the connection a new call to backend will happen and the cycle will go on.
  eventSource.onerror = (error) => {
    console.error('EventSource failed', error)
    eventSource.close()
  }

  return (
    <div className="flex-shrink-0 space-y-3 bg-gray-300 p-4">
      <Tabs defaultValue="documents" className="h-full space-y-6">
        <div className="space-between flex items-center">
          <TabsList>
            <TabsTrigger value="documents" className="space-x-2">
              <FileText size={18} />
              <p>Documents</p>
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="space-x-2">
              <Club size={18} />
              <p>Flashcards</p>
            </TabsTrigger>
            <TabsTrigger value="flashcard-creator" className="space-x-2">
              <Bot size={18} />
              <p>Creator</p>
            </TabsTrigger>
          </TabsList>
        </div>
        <h2 className="font-mono text-2xl">Console</h2>
        <h4
          className={cn(
            isConnected ? 'text-green-700' : 'text-red-700',
            'text-xl font-mono'
          )}
        >
          {chatId}
        </h4>
        <TabsContent value="documents">
          The retrieved docs will be shown here
        </TabsContent>
        <TabsContent value="flashcards">
          {flashcards.map((element) => (
            <Card className="p-4 bg-slate-50 max-w-[25vw] relative">
              <div className="flex space-x-1 absolute top-2 right-2">
                <button className="active:animate-ping">
                  <BadgeMinus
                    className="hover:fill-red-300 hover:stroke-red-800"
                    size={18}
                    strokeWidth={'1.25px'}
                  />
                </button>
                <button className="active:animate-ping">
                  <BadgePlus
                    className="hover:fill-green-300 hover:stroke-green-800 "
                    size={18}
                    strokeWidth={'1.25px'}
                  />
                </button>
              </div>

              <p className="text-slate-500 text-sm">front:</p>
              <Card className="p-4">
                <p key={element.id}>{element.front}</p>
              </Card>
              <p className="text-slate-500 text-sm">back:</p>
              <Card className="p-4">
                <p key={element.id}>{element.back}</p>
              </Card>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="flashcard-creator">
          Give instructions to the flashcard creator.
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Console
