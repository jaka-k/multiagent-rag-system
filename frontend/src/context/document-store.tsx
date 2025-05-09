import { getDocuments } from '@lib/fetchers/fetch-document.ts'
import { logger } from '@lib/logger.ts'
import type { Document } from '@mytypes/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DocumentStoreState {
  documentsByArea: Record<string, Record<string, Document>>
  loadingStates: Record<string, boolean>
  errorStates: Record<string, string | null>
  currentAreaId: string | null

  fetchDocumentsForArea: (areaId: string) => Promise<void>
  getDocument: (docId: string) => Document | null
  addDocument: (areaId: string, document: Document) => void
  updateDocument: (
    areaId: string,
    docId: string,
    updatedFields: Partial<Document>
  ) => void
  setCurrentAreaId: (areaId: string | null) => void
}

const useDocumentStore = create(
  persist<DocumentStoreState>(
    (set, get) => ({
      documentsByArea: {},
      loadingStates: {},
      errorStates: {},
      currentAreaId: null,

      fetchDocumentsForArea: async (areaId: string) => {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [areaId]: true
          },
          errorStates: {
            ...state.errorStates,
            [areaId]: null
          }
        }))

        try {
          const documents = await getDocuments(areaId)

          if (!documents) {
            throw new Error(`Failed to fetch documents for area ${areaId}`)
          }

          set((state) => ({
            documentsByArea: {
              ...state.documentsByArea,
              [areaId]: Object.fromEntries(
                documents.map((doc) => [doc.id, doc])
              )
            },
            loadingStates: {
              ...state.loadingStates,
              [areaId]: false
            }
          }))
        } catch (error) {
          logger.error(`Failed to fetch documents for area ${areaId}:`, error)

          set((state) => ({
            errorStates: {
              ...state.errorStates,
              [areaId]:
                error instanceof Error
                  ? error.message
                  : 'An unknown error occurred'
            },
            loadingStates: {
              ...state.loadingStates,
              [areaId]: false
            }
          }))
        }
      },

      getDocument: (docId: string) => {
        const { currentAreaId, documentsByArea } = get()
        if (!currentAreaId) return null

        return documentsByArea[currentAreaId]?.[docId] || null
      },

      addDocument: (areaId: string, document: Document) => {
        set((state) => {
          const areaDocuments = state.documentsByArea[areaId] || []
          return {
            documentsByArea: {
              ...state.documentsByArea,
              [areaId]: {
                ...areaDocuments,
                [document.id]: document
              }
            }
          }
        })
      },

      updateDocument: (
        areaId: string,
        docId: string,
        updatedFields: Partial<Document>
      ) => {
        set((state) => {
          const areaDocs = state.documentsByArea[areaId] || []
          const existing = areaDocs[docId]

          return {
            documentsByArea: {
              ...state.documentsByArea,
              [areaId]: {
                ...areaDocs,
                [docId]: existing
                  ? {
                      ...existing,
                      ...updatedFields
                    }
                  : existing
              }
            }
          }
        })
      },

      setCurrentAreaId: (areaId: string | null) => {
        set({
          currentAreaId: areaId
        })

        if (areaId) {
          const { documentsByArea, loadingStates } = get()
          const hasDocuments = areaId in documentsByArea
          const isLoading = loadingStates[areaId]

          if (!hasDocuments && !isLoading) {
            get().fetchDocumentsForArea(areaId)
          }
        }
      }
    }),
    {
      name: 'document-storage'
    }
  )
)

export default useDocumentStore
