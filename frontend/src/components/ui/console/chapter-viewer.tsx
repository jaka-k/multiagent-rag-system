'use client'

import { useConsoleStore } from '@context/console-store'
import type { ParentGroup } from '@lib/organize-chapters'
import { containerStyles, textStyles } from '@lib/styles'
import { cn } from '@lib/utils'
import type { Chapter } from '@mytypes/types'
import { Button } from '@ui/button.tsx'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@ui/collapsible'
import ChapterContent from '@ui/console/chapter-content'
import { ScrollArea } from '@ui/scroll-area'
import { Book, ChevronRight, FileText } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

export default function ChapterViewer({ chatId }: { chatId?: string }) {
  const [expandedBooks, setExpandedBooks] = React.useState<
    Record<string, boolean>
  >({})
  const [expandedChapters, setExpandedChapters] = React.useState<
    Record<string, boolean>
  >({})

  const consolesByChat = useConsoleStore((s) => s.consolesByChat)
  const currentConsole = useConsoleStore((s) => s.currentConsole)
  const activeChatId = chatId || currentConsole

  const chaptersSorted = activeChatId
    ? consolesByChat[activeChatId]?.chaptersSorted
    : null
  const books = chaptersSorted ? Object.values(chaptersSorted.byBook) : []

  const toggleBook = (bookId: string) => {
    setExpandedBooks((prev) => ({
      ...prev,
      [bookId]: !prev[bookId]
    }))
  }

  const toggleChapter = (chapterTag: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterTag]: !prev[chapterTag]
    }))
  }

  const collapseAll = () => {
    setExpandedBooks({})
    setExpandedChapters({})
  }

  return (
    <div className="flex flex-col h-full">
      <div className={containerStyles.header}>
        <h2 className={textStyles.h2}>Chapters</h2>
        <Button variant="ghost" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4 px-2 space-y-4">
          {books.length ? (
            books.map((book) => (
              <Collapsible
                key={book.id}
                open={!!expandedBooks[book.id]}
                onOpenChange={() => toggleBook(book.id)}
              >
                <div className={cn(containerStyles.innerCard, 'group')}>
                  <CollapsibleTrigger className="flex items-center w-full">
                    <div className="flex items-center flex-1">
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          priority={true}
                          width={60}
                          height={80}
                          className="mr-3 rounded-sm object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-[60px] h-[80px] bg-muted mr-3 flex items-center justify-center rounded-sm">
                          <Book className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <h4 className={textStyles.h4}>{book.title}</h4>
                    </div>
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pt-3">
                    <div className="space-y-4">
                      {book.parentGroups.map((group: ParentGroup) => (
                        <div key={group.label} className="space-y-2">
                          <h5 className="text-sm font-medium text-muted-foreground">
                            {group.label}
                          </h5>
                          <div className="bg-muted/20 p-2 rounded space-y-1">
                            {group.children.map((ch: Chapter) => (
                              <Collapsible
                                key={ch.chapterTag}
                                open={expandedChapters[ch.chapterTag]}
                                onOpenChange={() =>
                                  toggleChapter(ch.chapterTag)
                                }
                              >
                                <div className="group">
                                  <CollapsibleTrigger className="flex items-center justify-between w-full px-1">
                                    <div className="flex items-center">
                                      <FileText className="h-4 w-4 text-muted-foreground mr-2" />
                                      <span className={textStyles.h4}>
                                        {ch.label}
                                      </span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="pt-2">
                                    {expandedChapters[ch.chapterTag] && (
                                      <ChapterContent chapter={ch} />
                                    )}
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            ))}
                          </div>
                        </div>
                      ))}

                      {book.orphanedChapters.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-muted-foreground">
                            Other Chapters
                          </h5>
                          <div className="bg-muted/20 p-2 rounded space-y-1">
                            {book.orphanedChapters.map((ch: Chapter) => (
                              <Collapsible
                                key={ch.chapterTag}
                                open={expandedChapters[ch.chapterTag]}
                                onOpenChange={() =>
                                  toggleChapter(ch.chapterTag)
                                }
                              >
                                <div className="group">
                                  <CollapsibleTrigger className="flex items-center justify-between w-full px-1">
                                    <div className="flex items-center">
                                      <FileText className="h-4 w-4 text-muted-foreground mr-2" />
                                      <span className={textStyles.h4}>
                                        {ch.label}
                                      </span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="pt-2">
                                    {expandedChapters[ch.chapterTag] && (
                                      <ChapterContent chapter={ch} />
                                    )}
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
