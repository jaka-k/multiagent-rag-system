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
  description: string
  cover_image: string
  embedding_status: 'idle' | 'processing' | 'embedding' | 'completed'
}

export interface Message {
  id?: string
  session_id?: string
  role: 'user' | 'agent'
  content: string
  created_at?: string
}

export interface ChatData {
  id: string
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
  total_cost: number
  messages: Message[]
  flashcard_queue_id: string
  doc_chunk_queue_id: string
  area_id: string
}

export interface Flashcard {
  id: string
  front: string
  back: string
}

export interface FlashcardQueue {
  id: string
  session_id: string
  flashcard_data: string
  created_at: Date
  session: string
  flashcards: Flashcard[]
}

export interface FlashcardHandler {
  message: string
  id: string
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
