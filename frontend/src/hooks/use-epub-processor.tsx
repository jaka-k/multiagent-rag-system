import { logger } from '@lib/logger.ts'
import { EpubMetadata } from '@mytypes/epub-processor'
import { useEffect, useState } from 'react'

interface WorkerMessage {
  type: 'success' | 'error'
  payload: EpubMetadata | string
}

type UseEpubProcessor = {
  metadata: EpubMetadata | null
  loading: boolean
  error: string | null
  processEpub: (file: File) => Promise<void>
}

/**
 * Custom hook to handle EPUB processing and cover extraction.
 */
const useEpubProcessor = (): UseEpubProcessor => {
  const [metadata, setMetadata] = useState<EpubMetadata | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)

  useEffect(() => {
    const workerInstance = new Worker(
      new URL('../../workers/epub-processor.worker.ts', import.meta.url),
      {
        type: 'module'
      }
    )
    setWorker(workerInstance)

    workerInstance.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { type, payload } = e.data

      if (type === 'success') {
        setMetadata(payload as EpubMetadata)
      } else if (type === 'error') {
        setError(payload as string)
      }

      setLoading(false)
    }

    return () => {
      workerInstance.terminate()
    }
  }, [])

  /**
   * Processes the EPUB file to extract the cover image.
   * @param file - The EPUB file selected by the user.
   */
  const processEpub = async (file: File): Promise<void> => {
    if (!worker) {
      setError('Web Worker not initialized.')
      return
    }

    setLoading(true)
    setError(null)
    setMetadata(null)

    try {
      const arrayBuffer = await file.arrayBuffer()

      worker.postMessage({
        type: 'extractCoverImage',
        payload: {
          epubBuffer: arrayBuffer
        }
      })
    } catch (err) {
      logger.error('Error processing EPUB:', err)
      setError((err as Error).message || 'Unknown error')
      setLoading(false)
    }
  }

  return {
    metadata,
    loading,
    error,
    processEpub
  }
}

export default useEpubProcessor
