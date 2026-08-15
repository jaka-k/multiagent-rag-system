import useDocumentStore from '@context/document-store'
import { getAreas } from '@lib/fetchers/fetch-areas.ts'
import type { Area } from '@mytypes/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AreaStoreState {
  areas: Area[]
  fetchAreas: () => Promise<void>
  isLoading: boolean
  error: string | null
  activeArea: Area | null
  setActiveArea: (areaId: string) => void
  addArea: (area: Area) => void
}

const useAreaStore = create(
  persist<AreaStoreState>(
    (set, get) => ({
      areas: [],
      fetchAreas: async () => {
        set({
          isLoading: true,
          error: null
        })

        try {
          const areas = await getAreas()

          if (!areas) {
            throw new Error('Failed to fetch areas')
          }

          set({
            areas,
            isLoading: false,
            error: null
          })

          // Re-resolve the persisted activeArea against the fresh payload so
          // it never carries a stale shape from an older cache.
          const current = get().activeArea

          set({
            activeArea:
              (current && areas.find((a) => a.id === current.id)) ||
              areas[0] ||
              null
          })
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'An unknown error occurred',
            isLoading: false
          })
        }
      },
      isLoading: false,
      error: null,
      activeArea: null,
      setActiveArea: (areaId) => {
        const area = get().areas.find((a) => a.id === areaId)
        set({
          activeArea: area || null
        })

        const documentStore = useDocumentStore.getState()
        documentStore.setCurrentAreaId(areaId)
      },
      addArea: (area) => {
        const documentStore = useDocumentStore.getState()

        set((state) => ({
          areas: [...state.areas, area]
        }))
        documentStore.setCurrentAreaId(area?.id || null)
      }
    }),
    {
      name: 'area-storage'
    }
  )
)

export default useAreaStore
