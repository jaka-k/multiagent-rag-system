/**
 * Chat WebSocket wire protocol.
 *
 * Every frame is { type: WsEvent, payload: ... }. The event enum is
 * mirrored in backend/server/core/ws_protocol.py — keep the two in sync.
 */

export enum WsEvent {
  Content = 'content',
  Metadata = 'metadata',
  Context = 'context',
  Error = 'error'
}

export interface WsMetadataPayload {
  totalTokens?: number
  promptTokens?: number
  completionTokens?: number
  totalCost?: number
  [key: string]: unknown
}

/** Retrieved chapter as sent by the backend (snake_case wire format). */
export interface WsContextChapter {
  chapter_id: string
  chapter_tag: string
  chapter: string
  subchapter: string
  title?: string
  rerank_score: number
}

export interface WsErrorPayload {
  detail: string
  error_id: string
  step: string
  code: number
}

export type WsFrame =
  | { type: WsEvent.Content; payload: string }
  | { type: WsEvent.Metadata; payload: WsMetadataPayload }
  | { type: WsEvent.Context; payload: WsContextChapter[] }
  | { type: WsEvent.Error; payload: WsErrorPayload }

export function parseWsFrame(raw: string): WsFrame | null {
  try {
    const data = JSON.parse(raw)

    if (
      data &&
      typeof data === 'object' &&
      Object.values(WsEvent).includes(data.type)
    ) {
      return data as WsFrame
    }

    return null
  } catch {
    return null
  }
}
