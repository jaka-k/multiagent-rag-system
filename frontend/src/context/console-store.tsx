import { getChapterQueue } from '@lib/fetchers/fetch-chapters.ts'
import { getFlashcards } from '@lib/fetchers/fetch-flashcards.ts'
import { logger } from '@lib/logger.ts'
import { Chapter, Console, Flashcard } from '@mytypes/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConsoleStoreState {
  consolesByChat: Record<string, Console>
  currentConsole: string | null

  setCurrentConsole: (chatId: string) => void
  fetchConsoleQueues: (chatId: string) => void

  addFlashcard: (chatId: string, flashcard: Flashcard) => void
  removeFlashcard: (chatId: string, flashcardId: string) => void

  addChapter: (chatId: string, chapter: Chapter) => void

  clearConsole: (chatId: string) => void
}

export const useConsoleStore = create(
  persist<ConsoleStoreState>(
    (set, get) => ({
      consolesByChat: {},
      currentConsole: null,

      setCurrentConsole: (chatId) => {
        const existing = get().consolesByChat[chatId]

        if (!existing) {
          set((state) => ({
            consolesByChat: {
              ...state.consolesByChat,
              [chatId]: {
                flashcardQueue: null,
                chapterQueue: null
              }
            }
          }))
        }

        set({ currentConsole: chatId })
      },

      fetchConsoleQueues: async (chatId) => {
        try {
          const [chapterQueue, flashcardQueue] = await Promise.all([
            getChapterQueue(chatId),
            getFlashcards(chatId)
          ])

          const current = get().consolesByChat[chatId] || {
            chapterQueue: null,
            flashcardQueue: null
          }

          set((state) => ({
            consolesByChat: {
              ...state.consolesByChat,
              [chatId]: {
                ...current,
                chapterQueue: chapterQueue ?? current.chapterQueue,
                flashcardQueue: flashcardQueue ?? current.flashcardQueue
              }
            }
          }))

          if (!get().currentConsole) {
            set({ currentConsole: chatId })
          }
        } catch (error) {
          logger.error('Failed to fetch console queues:', error)
        }
      },

      addFlashcard: (chatId, flashcard) => {
        set((state) => {
          const console = state.consolesByChat[chatId]
          if (!console?.flashcardQueue) return state
          return {
            consolesByChat: {
              ...state.consolesByChat,
              [chatId]: {
                ...console,
                flashcardQueue: {
                  ...console.flashcardQueue,
                  flashcards: [...console.flashcardQueue.flashcards, flashcard]
                }
              }
            }
          }
        })
      },

      removeFlashcard: (chatId: string, flashcardId: string) => {
        set((state) => {
          const console = state.consolesByChat[chatId]
          if (!console?.flashcardQueue) return state

          return {
            consolesByChat: {
              ...state.consolesByChat,
              [chatId]: {
                ...console,
                flashcardQueue: {
                  ...console.flashcardQueue,
                  flashcards: console.flashcardQueue.flashcards.filter(
                    (fc) => fc.id !== flashcardId
                  )
                }
              }
            }
          }
        })
      },

      addChapter: (chatId, chunk) => {
        set((state) => {
          const console = state.consolesByChat[chatId]
          if (!console?.chapterQueue) return state

          return {
            consolesByChat: {
              ...state.consolesByChat,
              [chatId]: {
                ...console,
                chapterQueue: {
                  ...console.chapterQueue,
                  chapters: [...console.chapterQueue.chapters, chunk]
                }
              }
            }
          }
        })
      },

      clearConsole: (chatId) => {
        set((state) => ({
          consolesByChat: {
            ...state.consolesByChat,
            [chatId]: {
              flashcardQueue: null,
              chapterQueue: null
            }
          }
        }))
      }
    }),
    {
      name: 'console-storage'
    }
  )
)

export default useConsoleStore
