'use client'

import { BACKEND_DOMAIN } from '@containers/chat.tsx'
import { logger } from '@lib/logger.ts'
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
      await fetchEventSource(`http://${BACKEND_DOMAIN}/api/events/${chatId}`, {
        signal: controller.signal,
        async onopen(response) {
          if (
            response.ok &&
            response.headers.get('content-type') === 'text/event-stream'
          ) {
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
          setIsConnected(false)
          throw new Error('Connection closed')
        },
        onerror(err) {
          logger.error('SSE error:', err)

          if (err.message === 'Fatal error') {
            throw err
          }
        }
      })
    }

    connectSSE().catch((err) => {
      logger.error('SSE connection error caught:', err)
    })

    return () => {
      controller.abort()
      setIsConnected(false)
    }
  }, [chatId])

  return {
    isConnected
  }
}
