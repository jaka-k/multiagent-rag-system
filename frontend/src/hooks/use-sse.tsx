'use client'

import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useEffect, useState } from 'react'

interface SSEOptions {
  chatId: string
  onFlashcardUpdate: (flashcardIds: string[]) => void
  onDocumentUpdate: (documentIds: string[]) => void
}

export const useSSE = ({
  chatId,
  onFlashcardUpdate,
  onDocumentUpdate
}: SSEOptions) => {
  const [isConnected, setIsConnected] = useState(false)

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
            // TODO: Logging?
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
          const data = JSON.parse(event.data)
          if (event.event === 'flashcard') onFlashcardUpdate(data)
          if (event.event === 'documents') onDocumentUpdate(data)
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

  return {
    isConnected
  }
}
