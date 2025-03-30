import { getDocuments } from '@lib/fetchers/fetch-document.ts'
import { logger } from '@lib/logger.ts'
import type { Document } from '@mytypes/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DocumentStoreState {
  documentsByArea: Record<string, Document[]>
  loadingStates: Record<string, boolean>
  errorStates: Record<string, string | null>
  currentAreaId: string | null

  fetchDocumentsForArea: (areaId: string) => Promise<void>
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
              [areaId]: documents
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

      addDocument: (areaId: string, document: Document) => {
        set((state) => {
          const areaDocuments = state.documentsByArea[areaId] || []
          return {
            documentsByArea: {
              ...state.documentsByArea,
              [areaId]: [...areaDocuments, document]
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
          const areaDocuments = state.documentsByArea[areaId] || []
          return {
            documentsByArea: {
              ...state.documentsByArea,
              [areaId]: areaDocuments.map((doc) =>
                doc.id === docId
                  ? {
                      ...doc,
                      ...updatedFields
                    }
                  : doc
              )
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
