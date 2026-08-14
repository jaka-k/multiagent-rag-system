/**
 * SSE event protocol (/api/events/{sessionId}).
 *
 * Each frame is `event: <SseEvent>` with a JSON list of entity ids as data.
 * Mirrored in backend/server/core/sse_protocol.py — keep the two in sync.
 */

export enum SseEvent {
  Flashcard = 'flashcard',
  Documents = 'documents'
}

/** Both current events carry a list of entity ids to (re)fetch. */
export type SsePayload = string[]

export function parseSseEvent(
  eventName: string,
  rawData: string
): { event: SseEvent; ids: SsePayload } | null {
  if (!Object.values(SseEvent).includes(eventName as SseEvent)) return null

  try {
    const data = JSON.parse(rawData)

    if (!Array.isArray(data)) return null

    return { event: eventName as SseEvent, ids: data.map(String) }
  } catch {
    return null
  }
}
