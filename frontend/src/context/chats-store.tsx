import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Chat } from '@mytypes/types'
import { getAllChats } from '@lib/fetchers/fetch-chat.ts'
import { logger } from '@lib/logger.ts' // your simplified type

interface ChatStoreState {
  chats: Chat[]
  isLoading: boolean
  error: string | null

  fetchChatsForUser: () => Promise<void>
  addChat: (chat: Chat) => void
  updateChat: (id: string, updatedFields: Partial<Chat>) => void
}

const useChatStore = create<ChatStoreState>()(
  persist(
    (set) => ({
      chats: [],
      isLoading: false,
      error: null,

      fetchChatsForUser: async () => {
        set({ isLoading: true, error: null })

        try {
          const chats = await getAllChats()

          if (!chats) throw new Error('Empty response while fetching chats')

          set({
            chats,
            isLoading: false
          })
        } catch (error) {
          logger.error('Failed to fetch chats:', error)
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false
          })
        }
      },

      addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
      updateChat: (id, updatedFields) =>
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, ...updatedFields } : c
          )
        }))
    }),
    { name: 'chats-storage' }
  )
)

export default useChatStore
