'use client'

import { logger } from '@lib/logger.ts'
import {
  parseSseEvent,
  SseEvent,
  SsePayload
} from '@lib/sockets/sse-protocol.ts'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useEffect, useState } from 'react'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

interface SSEOptions {
  chatId: string
  onFlashcardUpdate: (flashcardIds: SsePayload) => Promise<void>
  onDocumentUpdate: (documentIds: SsePayload) => Promise<void>
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
      await fetchEventSource(`${BACKEND_URL}/api/events/${chatId}`, {
        signal: controller.signal,
        // the httpOnly token cookie is the credential (headers can't carry it)
        credentials: 'include',
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
        async onmessage(event) {
          const parsed = parseSseEvent(event.event, event.data)

          if (!parsed) {
            logger.error(`Unrecognized SSE event: ${event.event}`)

            return
          }

          switch (parsed.event) {
            case SseEvent.Flashcard:
              await onFlashcardUpdate(parsed.ids)
              break
            case SseEvent.Documents:
              await onDocumentUpdate(parsed.ids)
              break
            default:
              break
          }
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
