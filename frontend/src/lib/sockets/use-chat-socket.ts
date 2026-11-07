'use client'

import { logger } from '@lib/logger.ts'
import { publicEnv } from '@lib/runtime-config/public-env'
import {
  parseWsFrame,
  WsContextChapter,
  WsErrorPayload,
  WsEvent,
  WsMetadataPayload
} from '@lib/sockets/ws-protocol.ts'
import { useCallback } from 'react'
import useWebSocket from 'react-use-websocket'

export interface ChatSocketHandlers {
  onContent?: (chunk: string) => void
  onMetadata?: (metadata: WsMetadataPayload) => void
  onContext?: (chapters: WsContextChapter[]) => void
  onError?: (error: WsErrorPayload) => void
}

/** Typed chat socket: connects to the session stream (all clients on the
 * same chat receive every frame) and dispatches frames per WsEvent. */
export function useChatSocket(chatId: string, handlers: ChatSocketHandlers) {
  // http → ws, https → wss: the socket follows the backend URL's scheme.
  const socketUrl = `${publicEnv().backendUrl.replace(/^http/, 'ws')}/api/ws/${chatId}`

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
