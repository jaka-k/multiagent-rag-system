'use client'

import { useConsoleStore } from '@context/console-store'
import { ParentGroup } from '@lib/organize-chapters.ts'
import { containerStyles, textStyles } from '@lib/styles'
import { cn } from '@lib/utils'
import { Chapter } from '@mytypes/types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@ui/collapsible'
import ChapterContent from '@ui/console/chapter-content'
import { ScrollArea } from '@ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { Book, BookOpen, ChevronRight, FileText } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

export default function ChapterViewer({ chatId }: { chatId?: string }) {
  const [view, setView] = React.useState<'index' | 'content'>('index')
  const [expandedBooks, setExpandedBooks] = React.useState<
    Record<string, boolean>
  >({})
  const [expandedChapters, setExpandedChapters] = React.useState<
    Record<string, boolean>
  >({})

  const consolesByChat = useConsoleStore((state) => state.consolesByChat)
  const currentConsole = useConsoleStore((state) => state.currentConsole)

  // Use provided chatId or fall back to currentConsole from store
  const activeChatId = chatId || currentConsole

  // Get the sorted chapters from the store
  const chaptersSorted = activeChatId
    ? consolesByChat[activeChatId]?.chaptersSorted
    : null
  const books = chaptersSorted?.byBook
    ? Object.values(chaptersSorted.byBook)
    : []

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
        <div className="py-4 px-2 space-y-4">
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
                          className="mr-4 rounded-sm object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-[60px] h-[80px] mr-4 bg-muted rounded-sm">
                          <Book className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="text-left">
                        <h4 className={textStyles.h4}>{book.title}</h4>
                        <p className={textStyles.subtle}>
                          {book.parentGroups.reduce(
                            (count: number, group: ParentGroup[]) =>
                              count + 1 + group.length,
                            0
                          ) + book.orphanedChapters.length}{' '}
                          {book.parentGroups.reduce(
                            (count: number, group: ParentGroup[]) =>
                              count + 1 + group.length,
                            0
                          ) +
                            book.orphanedChapters.length ===
                          1
                            ? 'chapter'
                            : 'chapters'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pt-4 pl-4">
                    <div className="space-y-6">
                      {/* Parent Groups with Children */}
                      {book.parentGroups.map((group: ParentGroup) => (
                        <div key={group.parent.id} className="space-y-2">
                          {/* Parent Chapter Header */}
                          <div
                            className={cn(
                              'px-3 py-2 rounded-md bg-muted/30 border border-muted'
                            )}
                          >
                            <div className="flex items-center">
                              <div className="flex-shrink-0 mr-3">
                                <BookOpen className="h-5 w-5 text-primary/70" />
                              </div>
                              <div>
                                <h5
                                  className={cn(
                                    textStyles.h4,
                                    'text-primary/90'
                                  )}
                                >
                                  {group.parent.label && (
                                    <span className="font-medium text-muted-foreground mr-1">
                                      {group.parent.label}
                                    </span>
                                  )}
                                </h5>
                                {group.children?.length > 0 && (
                                  <p className={textStyles.subtle}>
                                    {group.children.length}{' '}
                                    {group.children.length === 1
                                      ? 'subchapter'
                                      : 'subchapters'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Child Chapters */}
                          {group.children?.length > 0 && (
                            <div className="space-y-2 ml-4 border-l-2 border-primary/20 pl-4">
                              {group.children.map((childChapter: Chapter) => (
                                <Collapsible
                                  key={childChapter.id}
                                  open={
                                    expandedChapters[
                                      `${book.id}-${childChapter.id}`
                                    ]
                                  }
                                  onOpenChange={() =>
                                    toggleChapter(book.id, childChapter.id)
                                  }
                                >
                                  <div
                                    className={cn(
                                      containerStyles.innerCard,
                                      'group hover:bg-accent/50 transition-colors'
                                    )}
                                  >
                                    <CollapsibleTrigger className="flex items-center w-full">
                                      <div className="flex items-center flex-1">
                                        <div className="flex-shrink-0 mr-3">
                                          <FileText className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                          <h6 className={textStyles.h4}>
                                            {childChapter.label && (
                                              <span className="font-medium text-muted-foreground mr-1">
                                                {childChapter.label}
                                              </span>
                                            )}
                                          </h6>
                                        </div>
                                      </div>
                                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                    </CollapsibleTrigger>

                                    <CollapsibleContent className="pt-4">
                                      {expandedChapters[
                                        `${book.id}-${childChapter.id}`
                                      ] && (
                                        <ChapterContent
                                          chapter={childChapter}
                                        />
                                      )}
                                    </CollapsibleContent>
                                  </div>
                                </Collapsible>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Orphaned/Standalone Chapters */}
                      {book.orphanedChapters.length > 0 && (
                        <div className="space-y-2 mt-4">
                          {book.orphanedChapters.length > 0 && (
                            <div
                              className={cn(
                                'px-3 py-2 rounded-md bg-muted/30 border border-muted'
                              )}
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0 mr-3">
                                  <FileText className="h-5 w-5 text-primary/70" />
                                </div>
                                <div>
                                  <h5
                                    className={cn(
                                      textStyles.h4,
                                      'text-primary/90'
                                    )}
                                  >
                                    Other Chapters
                                  </h5>
                                  <p className={textStyles.subtle}>
                                    {book.orphanedChapters.length}{' '}
                                    {book.orphanedChapters.length === 1
                                      ? 'chapter'
                                      : 'chapters'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2 ml-4 border-l-2 border-primary/20 pl-4">
                            {book.orphanedChapters.map((chapter: Chapter) => (
                              <Collapsible
                                key={chapter.id}
                                open={
                                  expandedChapters[`${book.id}-${chapter.id}`]
                                }
                                onOpenChange={() =>
                                  toggleChapter(book.id, chapter.id)
                                }
                              >
                                <div
                                  className={cn(
                                    containerStyles.innerCard,
                                    'group hover:bg-accent/50 transition-colors'
                                  )}
                                >
                                  <CollapsibleTrigger className="flex items-center w-full">
                                    <div className="flex items-center flex-1">
                                      <div className="flex-shrink-0 mr-3">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <h6 className={textStyles.h4}>
                                          {chapter.label && (
                                            <span className="font-medium text-muted-foreground mr-1">
                                              {chapter.label}
                                            </span>
                                          )}
                                        </h6>
                                      </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                  </CollapsibleTrigger>

                                  <CollapsibleContent className="pt-4">
                                    {expandedChapters[
                                      `${book.id}-${chapter.id}`
                                    ] && <ChapterContent chapter={chapter} />}
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            ))}
                          </div>
                        </div>
                      )}
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
