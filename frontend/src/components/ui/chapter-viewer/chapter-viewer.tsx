'use client'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@components/ui/collapsible'
import { ScrollArea } from '@components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@components/ui/select'
import { containerStyles, textStyles } from '@lib/styles'
import { cn } from '@lib/utils'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

const books = [
  {
    id: 1,
    title: 'The Great Gatsby',
    chapters: [
      { id: 1, name: 'Chapter 1: The Carraway Residence' },
      { id: 2, name: 'Chapter 2: The Valley of Ashes' },
      { id: 3, name: 'Chapter 3: Gatsby’s Mansion' }
    ],
    coverUrl: '/efficient-go.png'
  },
  {
    id: 2,
    title: 'To Kill a Mockingbird',
    chapters: [
      { id: 1, name: 'Chapter 1: Maycomb, Alabama' },
      { id: 2, name: 'Chapter 2: Scout Goes to School' },
      { id: 3, name: 'Chapter 3: Atticus Takes the Case' }
    ],
    coverUrl: '/mastering-go.jpg'
  }
]

export default function ChapterViewer() {
  const [view, setView] = React.useState<'index' | 'content'>('index')
  const [expandedChapters, setExpandedChapters] = React.useState<
    Record<string, boolean>
  >({})

  const toggleChapter = (bookId: number, chapterId: number) => {
    const key = `${bookId}-${chapterId}`
    setExpandedChapters((prev) => ({ ...prev, [key]: !prev[key] }))
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
        <div className="p-4 space-y-4">
          {books.map((book) => (
            <div key={book.id} className="space-y-2">
              <h3 className={textStyles.h3}>{book.title}</h3>
              {book.chapters.map((chapter) => (
                <Collapsible
                  key={chapter.id}
                  open={expandedChapters[`${book.id}-${chapter.id}`]}
                  onOpenChange={() => toggleChapter(book.id, chapter.id)}
                >
                  <div
                    className={cn(
                      containerStyles.innerCard,
                      'group hover:bg-accent/50'
                    )}
                  >
                    <CollapsibleTrigger className="flex items-center w-full">
                      <div className="flex items-center flex-1">
                        <Image
                          src={book.coverUrl}
                          alt={`Cover of ${book.title}`}
                          width={60}
                          height={80}
                          className="mr-4 rounded-sm"
                        />
                        <div>
                          <h4 className={textStyles.h4}>{chapter.name}</h4>
                          <p className={textStyles.subtle}>{book.title}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                      {expandedChapters[`${book.id}-${chapter.id}`] && (
                        <ChapterContent
                          bookId={book.id}
                          chapterId={chapter.id}
                        />
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function ChapterContent({
  bookId,
  chapterId
}: {
  bookId: number
  chapterId: number
}) {
  const [content, setContent] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let isCancelled = false

    async function loadChapter() {
      setLoading(true)
      const fetchedContent = await fetchChapterContent(bookId, chapterId)
      if (!isCancelled) {
        setContent(fetchedContent)
        setLoading(false)
      }
    }

    loadChapter()

    return () => {
      isCancelled = true
    }
  }, [bookId, chapterId])

  if (loading) {
    return <div className="text-center py-4">Loading chapter content...</div>
  }

  return (
    <div className="prose prose-sm max-w-none">
      <p>{content}</p>
    </div>
  )
}

async function fetchChapterContent(
  bookId: number,
  chapterId: number
): Promise<string> {
  // Simulate an API call
  console.log(`Fetching content for book ${bookId}, chapter ${chapterId}`)
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(
        `This is the content for chapter ${chapterId} of book ${bookId}. In a real application, this would be fetched from an API or database.`
      )
    }, 1000)
  })
}
