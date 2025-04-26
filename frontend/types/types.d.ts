export interface Area {
  id: string
  created: Date
  name: string
  label: string
  documents: Document[]
}

export interface Document {
  id: string
  user_id: string
  area_id: string
  created_at: Date
  title: string
  fileSize: number
  description: string
  coverImage: string
  embedding_status: 'idle' | 'processing' | 'embedding' | 'completed' | 'failed'
}

export interface Message {
  id?: string
  sessionId?: string
  role: 'user' | 'agent'
  content: string
  createdAt?: string
}

export interface Chat {
  id: string
  title: string
  status: string | null
  totalTokens: number
  promptTokens: number
  completionTokens: number
  totalCost: number
  areaId: string
}

export interface ChatData extends Chat {
  messages: Message[]
  flashcardQueueId: string
  docChunkQueueId: string
}

export interface Flashcard {
  id: string
  front: string
  back: string
}

export interface FlashcardQueue {
  id: string
  sessionId: string
  flashcardData: string
  createdAt: Date
  flashcards: Flashcard[]
}

export interface FlashcardHandler {
  message: string
  id: string
}

export interface Chapter {
  id: string
  documentId: string
  label: string
  order: number
  parentLabel: string
  chapterTag: string
  content?: string
}

export interface ChapterQueue {
  id: string
  sessionId: string
  createdAt: Date
  chapters: Chapter[]
}

export interface ChapterQueueSorted {
  byBook: Record<string, OrganizedBook>
}

export interface Console {
  flashcardQueue: FlashcardQueue | null
  chapterQueue: ChapterQueue | null
  chaptersSorted: ChapterQueueSorted | null
}

export type EpubFile = {
  id: string
  name: string
  size: number
  url: string
  cover: string
  tokens: number
  cost: number
}

export type CreateDocumentRequest = {
  title: string
  area_id: string
  description: string
  file_path: string
  file_size: number
  cover_image: string
}

export type CreateDocumentResponse = {
  message: string
  id: string
}

export type CreateAreaResponse = {
  id: string
  created: Date
  name: string
  label: string
}

export type WithRefreshedToken<T> = T & {
  refreshToken: string | null
}
