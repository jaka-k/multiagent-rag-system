'use client'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@ui/collapsible.tsx'
import { ScrollArea } from '@ui/scroll-area.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ui/select.tsx'
import { useConsoleStore } from '@context/console-store.tsx'
import { containerStyles, textStyles } from '@lib/styles.ts'
import { cn } from '@lib/utils.ts'
import { Book, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

import mockChapters from '../../../../mock/mockChapters.ts'
import useDocumentStore from '@context/document-store.tsx'

export default function ChapterViewer({ chatId }: { chatId: string }) {
  const [view, setView] = React.useState<'index' | 'content'>('index')
  const [expandedBooks, setExpandedBooks] = React.useState<
    Record<string, boolean>
  >({})
  const [expandedChapters, setExpandedChapters] = React.useState<
    Record<string, boolean>
  >({})

  const consolesByChat = useConsoleStore((state) => state.consolesByChat)
  const { getDocument } = useDocumentStore()

  const chapterQueue = consolesByChat[chatId]?.chapterQueue ?? null
  const chapters = chapterQueue?.chapters || mockChapters

  const bookMap = React.useMemo(() => {
    const map = new Map()

    chapters.forEach((chapter) => {
      if (!chapter.documentId) return
      const doc = getDocument(chapter.documentId)
      if (!doc) return

      if (!map.has(chapter.documentId)) {
        map.set(chapter.documentId, {
          id: chapter.documentId,
          title: doc.title || 'Unknown Book',
          coverUrl: doc.coverImage ?? '/mastering-go.jpg',
          chapters: []
        })
      }

      map.get(chapter.documentId).chapters.push(chapter)
    })

    console.log(map)

    return map
  }, [chapters])

  const books = React.useMemo(() => Array.from(bookMap.values()), [bookMap])

  const toggleBook = (bookId: string) => {
    setExpandedBooks((prev) => ({
      ...prev,
      [bookId]: !prev[bookId]
    }))
  }

  const toggleChapter = (bookId: string, chapterId: string) => {
    const key = `${bookId}-${chapterId}`
    setExpandedChapters((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="flex flex-col h-full">
      <div className={containerStyles.header}>
        <h2 className={textStyles.h2}>Chapters</h2>
        <Select
          value={view}
          onValueChange={(v) => setView(v as 'index' | 'content')}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="index">Index View</SelectItem>
            <SelectItem value="content">Content View</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4 space-y-4">
          {books.length > 0 ? (
            books.map((book) => (
              <Collapsible
                key={book.id}
                open={expandedBooks[book.id]}
                onOpenChange={() => toggleBook(book.id)}
              >
                <div
                  className={cn(
                    containerStyles.innerCard,
                    'group hover:bg-accent/50'
                  )}
                >
                  <CollapsibleTrigger className="flex items-center w-full">
                    <div className="flex items-center flex-1">
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl || '/placeholder.svg'}
                          alt={`Cover of ${book.title}`}
                          width={70}
                          height={90}
                          className="mr-4 rounded-sm object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-[60px] h-[80px] mr-4 bg-muted rounded-sm">
                          <Book className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="text-left">
                        <h4 className={textStyles.h4}>{book.title}</h4>
                        <p className={textStyles.subtle}>
                          {book.chapters.length}{' '}
                          {book.chapters.length === 1 ? 'chapter' : 'chapters'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pt-4 pl-4">
                    <div className="space-y-2">
                      {book.chapters.map((chapter) => (
                        <Collapsible
                          key={chapter.id}
                          open={expandedChapters[`${book.id}-${chapter.id}`]}
                          onOpenChange={() =>
                            toggleChapter(book.id, chapter.id)
                          }
                        >
                          <div
                            className={cn(
                              containerStyles.innerCard,
                              'group hover:bg-accent/50'
                            )}
                          >
                            <CollapsibleTrigger className="flex items-center w-full">
                              <div className="flex items-center flex-1">
                                <div>
                                  <h5 className={textStyles.h4}>
                                    {chapter.title ||
                                      `Chapter ${chapter.chapterNumber || ''}`}
                                  </h5>
                                  {chapter.subtitle && (
                                    <p className={textStyles.subtle}>
                                      {chapter.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                            </CollapsibleTrigger>

                            <CollapsibleContent className="pt-4">
                              {expandedChapters[`${book.id}-${chapter.id}`] && (
                                <ChapterContent chapter={chapter} />
                              )}
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No chapters available</p>
              <p className="text-xs mt-1">
                Upload documents or select a different chat to view chapters
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// PLACEHOLDER -> Move to custom component
function ChapterContent({ chapter }: { chapter: any }) {
  const [content, setContent] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let isCancelled = false

    async function loadChapter() {
      setLoading(true)

      try {
        // Use chapter.content if available, otherwise fetch it
        if (chapter.content) {
          if (!isCancelled) {
            setContent(chapter.content)
            setLoading(false)
          }
        } else {
          const fetchedContent = await fetchChapterContent(
            chapter.id,
            chapter.bookId
          )
          if (!isCancelled) {
            setContent(fetchedContent)
            setLoading(false)
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setContent('Error loading chapter content.')
          setLoading(false)
        }
      }
    }

    loadChapter()

    return () => {
      isCancelled = true
    }
  }, [chapter])

  if (loading) {
    return <div className="text-center py-4">Loading chapter content...</div>
  }

  return (
    <div className="prose prose-sm max-w-none">
      <div
        className="overflow-x-clip"
        dangerouslySetInnerHTML={{
          __html: content || 'No content available'
        }}
      />
    </div>
  )
}

async function fetchChapterContent(
  chapterId: string,
  bookId: string
): Promise<string> {
  // This would be replaced with an actual API call in production
  console.log(`Fetching content for book ${bookId}, chapter ${chapterId}`)
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(
        `This is the content for chapter ${chapterId} of book ${bookId}. In a real application, this would be fetched from an API or database.`
      )
    }, 1000)
  })
}
