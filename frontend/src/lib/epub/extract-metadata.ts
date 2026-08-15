import type { EpubMetadata } from '@mytypes/epub-processor'

interface WorkerMessage {
  type: 'success' | 'error'
  payload: EpubMetadata | string
}

/** One-shot promise wrapper around the EPUB worker — lets callers process
 *  a queue of files sequentially (the hook variant is single-file state). */
export function extractEpubMetadata(file: File): Promise<EpubMetadata> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('@workers/epub-processor.worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      worker.terminate()

      if (e.data.type === 'success') resolve(e.data.payload as EpubMetadata)
      else reject(new Error(String(e.data.payload)))
    }

    worker.onerror = (e) => {
      worker.terminate()
      reject(new Error(e.message || 'EPUB worker crashed'))
    }

    file.arrayBuffer().then(
      (epubBuffer) => {
        worker.postMessage({
          type: 'extractCoverImage',
          payload: { epubBuffer }
        })
      },
      (err) => {
        worker.terminate()
        reject(err)
      }
    )
  })
}
