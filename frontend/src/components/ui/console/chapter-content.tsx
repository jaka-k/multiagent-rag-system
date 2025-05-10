import { logger } from '@lib/logger.ts'
import { Chapter } from '@mytypes/types'
import * as React from 'react'

export default function ChapterContent({ chapter }: { chapter: Chapter }) {
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
            chapter.chapterTag
          )

          if (!isCancelled) {
            setContent(fetchedContent)
            setLoading(false)
          }
        }
      } catch (error) {
        if (!isCancelled) {
          logger.error(error)
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
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(
        `This is will be the content for chapter ${chapterId} of book ${bookId}. Not yet implemented.`
      )
    }, 1000)
  })
}
