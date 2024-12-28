import { EpubMetadata } from '@types/epub-processor'
import { useEffect, useState } from 'react'

interface WorkerMessage {
  type: 'success' | 'error'
  payload: EpubMetadata | string
}

/**
 * Custom hook to handle EPUB processing and cover extraction.
 */
const useEpubProcessor = () => {
  const [metadata, setMetadata] = useState<EpubMetadata | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)

  useEffect(() => {
    // Initialize the Web Worker
    const workerInstance = new Worker(
      new URL('../../workers/epub-processor.worker.ts', import.meta.url),
      {
        type: 'module'
      }
    )
    setWorker(workerInstance)

    // Listen for messages from the worker
    workerInstance.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { type, payload } = e.data

      if (type === 'success') {
        setMetadata(payload as EpubMetadata)
      } else if (type === 'error') {
        setError(payload as string)
      }

      setLoading(false)
    }

    // Cleanup the worker on unmount
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
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Post message to the worker
      worker.postMessage({
        type: 'extractCoverImage',
        payload: { epubBuffer: arrayBuffer }
      })
    } catch (err: any) {
      console.error('Error processing EPUB:', err)
      setError(err.message || 'Unknown error')
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
