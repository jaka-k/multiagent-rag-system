import * as React from 'react'

export default function ChapterContent({ chapter }: { chapter: any }) {
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