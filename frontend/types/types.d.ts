export interface Area {
  id: string
  created: Date
  name: string
  label: string
  documents: Document[]
}

export interface Document {
  id: string
  userId: string
  areaId: string
  createdAt: Date
  title: string
  author?: string
  fileSize: number
  description: string
  coverImage: string
  embeddingStatus: EmbeddingStatus
}

export type EmbeddingStatus =
  'idle' | 'processing' | 'embedding' | 'completed' | 'failed'

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
  areaId: string
  description: string
  filePath: string
  fileSize: number
  coverImage: string
  author?: string
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

export interface Agent {
  id: string
  areaId: string
  name: string
  description: string
  icon: string
  cardType: string
  systemPrompt: string
  variables: string[]
  isActive: boolean
  difficulty: string | null
  model: string | null
}

export interface AreaFlashcard {
  id: string
  front: string
  back: string
  tag: string
  ankiId: string | null
  reps: number
  isMastered: boolean
}

export interface AreaFlashcardQueue {
  sessionId: string
  sessionTitle: string
  updatedAt: string
  cards: AreaFlashcard[]
  studied: number
  mastered: number
}

export interface AreaFlashcards {
  queues: AreaFlashcardQueue[]
  loose: AreaFlashcard[]
}
