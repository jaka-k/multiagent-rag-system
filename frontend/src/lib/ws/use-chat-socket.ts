'use client'

import { logger } from '@lib/logger.ts'
import {
  parseWsFrame,
  WsContextChapter,
  WsErrorPayload,
  WsEvent,
  WsMetadataPayload
} from '@lib/ws/protocol.ts'
import { useCallback } from 'react'
import useWebSocket from 'react-use-websocket'

export const BACKEND_DOMAIN =
  process.env.NEXT_PUBLIC_BACKEND_DOMAIN || 'localhost:8080'

const isProd = process.env.NODE_ENV === 'production'
const wsProtocol = isProd ? 'wss' : 'ws'

export interface ChatSocketHandlers {
  onContent?: (chunk: string) => void
  onMetadata?: (metadata: WsMetadataPayload) => void
  onContext?: (chapters: WsContextChapter[]) => void
  onError?: (error: WsErrorPayload) => void
}

/** Typed chat socket: connects to the session stream (all clients on the
 * same chat receive every frame) and dispatches frames per WsEvent. */
export function useChatSocket(chatId: string, handlers: ChatSocketHandlers) {
  const socketUrl = `${wsProtocol}://${BACKEND_DOMAIN}/api/ws/${chatId}`

  const onMessage = useCallback(
    (event: MessageEvent) => {
      const frame = parseWsFrame(event.data)

      if (!frame) {
        logger.error('Unrecognized WS frame')

        return
      }

      switch (frame.type) {
        case WsEvent.Content:
          handlers.onContent?.(frame.payload)
          break
        case WsEvent.Metadata:
          handlers.onMetadata?.(frame.payload)
          break
        case WsEvent.Context:
          handlers.onContext?.(frame.payload)
          break
        case WsEvent.Error:
          handlers.onError?.(frame.payload)
          break
        default:
          break
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      handlers.onContent,
      handlers.onMetadata,
      handlers.onContext,
      handlers.onError
    ]
  )

  const { sendMessage, readyState } = useWebSocket(socketUrl, {
    onMessage,
    shouldReconnect: () => true
  })

  return {
    send: sendMessage,
    connected: readyState === 1
  }
}
