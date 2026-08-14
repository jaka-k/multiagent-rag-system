import { create } from 'zustand'

export interface RetrievedChapter {
  chapterId: string
  chapterTag: string
  chapter: string
  subchapter: string
  title?: string
  rerankScore: number
}

interface RetrievalStoreState {
  byChat: Record<string, RetrievedChapter[]>
  setRetrieved: (chatId: string, chapters: RetrievedChapter[]) => void
}

/** Latest RAG retrieval per chat — written by the WS stream, read by the sidebar. */
const useRetrievalStore = create<RetrievalStoreState>((set) => ({
  byChat: {},
  setRetrieved: (chatId, chapters) =>
    set((state) => ({
      byChat: { ...state.byChat, [chatId]: chapters }
    }))
}))

export default useRetrievalStore
