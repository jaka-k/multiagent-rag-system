/* eslint-disable no-underscore-dangle */
import useDocumentStore from '@context/document-store.tsx'
import { Chapter, ChapterQueueSorted } from '@mytypes/types'

// A group of chapters under a common label
export interface ParentGroup {
  label: string // the grouping label (parentLabel or own label)
  children: Chapter[] // all chapters that belong to this label
}

export interface OrganizedBook {
  id: string
  title: string
  coverUrl?: string
  parentGroups: ParentGroup[]
  orphanedChapters: Chapter[]
  _map?: Map<string, ParentGroup>
}

const { getDocument } = useDocumentStore.getState()

/**
 * Build grouped structure: group by parentLabel if present, else by own label.
 */
export function buildSorted(chapters: Chapter[]): ChapterQueueSorted {
  const byBook: Record<string, OrganizedBook> = {}
  const pgMaps: Record<string, Map<string, ParentGroup>> = {}

  chapters.forEach((ch) => {
    const docId = ch.documentId
    if (!docId) return

    // initialize book container & map if needed
    if (!byBook[docId]) {
      const doc = getDocument(docId)
      byBook[docId] = {
        id: docId,
        title: doc?.title ?? 'Unknown',
        coverUrl: doc?.coverImage,
        parentGroups: [],
        orphanedChapters: []
      }
      pgMaps[docId] = new Map()
    }

    const map = pgMaps[docId]!
    // determine grouping key
    const groupKey = ch.parentLabel?.trim() || ch.label

    // fetch or create the group
    let group = map.get(groupKey)

    if (!group) {
      group = {
        label: groupKey,
        children: []
      }
      map.set(groupKey, group)
    }

    // if this chapter has no parentLabel but its own label equals groupKey,
    // it’s a parent-level content: put into children as well
    group.children.push(ch)
  })

  // finalize grouping & sorting
  Object.keys(byBook).forEach((docId) => {
    const map = pgMaps[docId]
    const groups = Array.from(map.values())

    // sort each group's children by order
    groups.forEach((pg) => {
      pg.children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    })
    // sort groups by first child's order or 0
    groups.sort(
      (a, b) => (a.children[0]?.order ?? 0) - (b.children[0]?.order ?? 0)
    )

    byBook[docId].parentGroups = groups
    // cache map for incremental updates
    byBook[docId]._map = map
  })

  return {
    byBook
  }
}

/**
 * Incrementally insert a chapter into the grouped structure.
 */
export function updateSorted(
  sorted: ChapterQueueSorted | null,
  chapter: Chapter
): ChapterQueueSorted {
  const result: ChapterQueueSorted = sorted
    ? {
        byBook: {
          ...sorted.byBook
        }
      }
    : {
        byBook: {}
      }

  const docId = chapter.documentId
  if (!docId) return result

  let book = result.byBook[docId]

  if (!book) {
    const doc = getDocument(docId)
    book = {
      id: docId,
      title: doc?.title ?? 'Unknown',
      coverUrl: doc?.coverImage,
      parentGroups: [],
      orphanedChapters: []
    }
    result.byBook[docId] = book
  }

  // ensure map cache
  if (!book._map) {
    book._map = new Map(
      book.parentGroups.map((pg: ParentGroup) => [pg.label, pg])
    )
  }

  const map = book._map!

  const groupKey = chapter.parentLabel?.trim() || chapter.label
  let group = map.get(groupKey)

  if (!group) {
    group = {
      label: groupKey,
      children: []
    }
    map.set(groupKey, group)
    book.parentGroups.push(group)
  }

  group.children.push(chapter)

  // re-sort children & groups
  book.parentGroups.forEach((pg: ParentGroup) => {
    pg.children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  })
  book.parentGroups.sort(
    (a: ParentGroup, b: ParentGroup) =>
      (a.children[0]?.order ?? 0) - (b.children[0]?.order ?? 0)
  )

  return result
}
