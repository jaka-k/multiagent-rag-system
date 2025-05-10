import { getChapterQueue } from '@lib/fetchers/fetch-chapters.ts'
import { getFlashcards } from '@lib/fetchers/fetch-flashcards.ts'
import { logger } from '@lib/logger.ts'
import { buildSorted, updateSorted } from '@lib/organize-chapters.ts'
import { Chapter, ChapterQueueSorted, Console, Flashcard } from '@mytypes/types'
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
                chapterQueue: null,
                chaptersSorted: null
              }
            }
          }))
        }

        set({
          currentConsole: chatId
        })
      },

      fetchConsoleQueues: async (chatId) => {
        try {
          const [chapterQueue, flashcardQueue] = await Promise.all([
            getChapterQueue(chatId),
            getFlashcards(chatId)
          ])
          const sorted: ChapterQueueSorted = buildSorted(chapterQueue.chapters)

          const current = get().consolesByChat[chatId] || {
            chapterQueue,
            flashcardQueue,
            chaptersSorted: sorted
          }

          set((state) => ({
            consolesByChat: {
              ...state.consolesByChat,
              [chatId]: {
                ...current,
                chapterQueue: chapterQueue ?? current.chapterQueue,
                flashcardQueue: flashcardQueue ?? current.flashcardQueue,
                chaptersSorted: sorted
              }
            }
          }))

          if (!get().currentConsole) {
            set({
              currentConsole: chatId
            })
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

      addChapter: (chatId, chapter) => {
        set((state) => {
          const cons = state.consolesByChat[chatId]
          if (!cons) return state
          const flat = [...cons.chapterQueue!.chapters, chapter]
          const sorted = updateSorted(cons.chaptersSorted, chapter)

          return {
            consolesByChat: {
              ...state.consolesByChat,
              [chatId]: {
                ...cons,
                chapterQueue: {
                  ...cons.chapterQueue!,
                  chapters: flat
                },
                chaptersSorted: sorted
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
              chapterQueue: null,
              chaptersSorted: null
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
