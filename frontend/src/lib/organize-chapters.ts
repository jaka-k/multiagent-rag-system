/* eslint-disable no-underscore-dangle */
import DocumentStore from '@context/document-store.tsx'
import { Chapter, ChapterQueueSorted } from '@mytypes/types'

export interface ParentGroup {
  parent: Chapter
  children: Chapter[]
}

export interface OrganizedBook {
  id: string
  title: string
  coverUrl?: string
  parentGroups: ParentGroup[]
  orphanedChapters: Chapter[]
  // internal cache for fast lookups when inserting
  _map?: Map<string, ParentGroup>
}

/**
 * Build the sorted structure in one pass, pulling getDocument from the store.
 * Sorts parent groups and their children by the `order` field (missing → 0).
 */
export function buildSorted(chapters: Chapter[]): ChapterQueueSorted {
  const { getDocument } = DocumentStore()
  const byBook: Record<string, OrganizedBook> = {}
  const pgMaps: Record<string, Map<string, ParentGroup>> = {}

  chapters.forEach((ch) => {
    if (!ch.documentId) return

    // initialize book container & map
    if (!byBook[ch.documentId]) {
      const doc = getDocument(ch.documentId)
      byBook[ch.documentId] = {
        id: ch.documentId,
        title: doc?.title ?? 'Unknown',
        coverUrl: doc?.coverImage,
        parentGroups: [],
        orphanedChapters: []
      }
      pgMaps[ch.documentId] = new Map()
    }

    const book = byBook[ch.documentId]
    const map = pgMaps[ch.documentId]!

    if (ch.parentLabel) {
      // child: ensure its parent group exists
      if (!map.has(ch.parentLabel)) {
        // attempt to find the parent chapter in the flat list
        const parent = chapters.find(
          (c) => c.documentId === ch.documentId && c.label === ch.parentLabel
        )

        if (parent)
          map.set(ch.parentLabel, {
            parent,
            children: []
          })
        else {
          // no parent found → orphan
          book.orphanedChapters.push(ch)
          return
        }
      }

      map.get(ch.parentLabel)!.children.push(ch)
    } else if (!map.has(ch.label)) {
      // top-level parent in one conditional
      map.set(ch.label, {
        parent: ch,
        children: []
      })
    }
  })

  // finalize grouping & sorting
  Object.keys(byBook).forEach((docId) => {
    const map = pgMaps[docId]
    const groups = Array.from(map.values())

    // sort children within each parent-group
    groups.forEach((pg) => {
      pg.children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    })

    // sort parent-groups by parent.order
    groups.sort((a, b) => (a.parent.order ?? 0) - (b.parent.order ?? 0))

    byBook[docId].parentGroups = groups
    byBook[docId]._map = map
  })

  return { byBook }
}

/**
 * Incrementally insert one chapter into existing sorted structure.
 * Uses the cached `_map` on each book for O(1) parent-group lookup,
 * then re-sorts only the affected arrays.
 */
export function updateSorted(
  sorted: ChapterQueueSorted | null,
  chapter: Chapter
): ChapterQueueSorted {
  const { getDocument } = DocumentStore()
  // shallow clone or initialize
  const result: ChapterQueueSorted = sorted
    ? { byBook: { ...sorted.byBook } }
    : { byBook: {} }

  // ensure book exists
  let book = result.byBook[chapter.documentId!]

  if (!book) {
    const doc = getDocument(chapter.documentId!)
    book = {
      id: chapter.documentId!,
      title: doc?.title ?? 'Unknown',
      coverUrl: doc?.coverImage,
      parentGroups: [],
      orphanedChapters: []
    }
    result.byBook[chapter.documentId!] = book
  }

  // ensure internal map cache
  if (!book._map) {
    const m = new Map<string, ParentGroup>()
    book.parentGroups.forEach((pg: ParentGroup) => m.set(pg.parent.label, pg))
    book._map = m
  }

  const m = book._map!

  if (chapter.parentLabel) {
    const pg = m.get(chapter.parentLabel)

    if (pg) {
      pg.children.push(chapter)
      // re-sort children
      pg.children.sort(
        (a: Chapter, b: Chapter) => (a.order ?? 0) - (b.order ?? 0)
      )
    } else {
      book.orphanedChapters.push(chapter)
    }
  } else {
    // new top-level parent
    const newPg: ParentGroup = {
      parent: chapter,
      children: []
    }
    m.set(chapter.label, newPg)
    book.parentGroups.push(newPg)
  }

  // re-sort parent-groups
  book.parentGroups.sort(
    (a: ParentGroup, b: ParentGroup) =>
      (a.parent.order ?? 0) - (b.parent.order ?? 0)
  )

  return result
}
