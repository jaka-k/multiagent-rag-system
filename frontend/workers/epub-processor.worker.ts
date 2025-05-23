import {
  EpubMetadata,
  WorkerIncomingMessage,
  WorkerOutgoingMessage
} from '@mytypes/epub-processor'
import {
  extractMetadata,
  resolveRelativePath,
  uint8ArrayToBase64
} from '@workers/worker-utils.ts'
import { unzipSync } from 'fflate'
import { DOMParser } from 'xmldom'

function extractEpubMetadata(epubBuffer: ArrayBuffer): EpubMetadata {
  const buffer = new Uint8Array(epubBuffer)
  const unziped = unzipSync(buffer)

  const containerData = unziped['META-INF/container.xml']

  if (!containerData) {
    throw new Error('container.xml not found in EPUB.')
  }

  const containerText = new TextDecoder().decode(containerData)
  const parser = new DOMParser()
  const containerDoc = parser.parseFromString(containerText, 'application/xml')
  const rootfile = containerDoc.getElementsByTagName('rootfile')[0]

  if (!rootfile) {
    throw new Error('rootfile not found in container.xml.')
  }

  const fullPath = rootfile.getAttribute('full-path')

  if (!fullPath) {
    throw new Error('full-path attribute not found in rootfile.')
  }

  const contentOpfData = unziped[fullPath]

  if (!contentOpfData) {
    throw new Error(`content.opf not found at path: ${fullPath}`)
  }

  const contentOpfText = new TextDecoder().decode(contentOpfData)
  const contentDoc = parser.parseFromString(contentOpfText, 'application/xml')
  const metadata = extractMetadata(contentDoc)
  let coverHref: string | null = null
  const metaTags = contentDoc.getElementsByTagName('meta')

  for (let i = 0; i < metaTags.length; i++) {
    const meta = metaTags[i]

    if (meta.getAttribute('name') === 'cover') {
      const coverId = meta.getAttribute('content')

      if (coverId && /\.(png|jpe?g)$/i.test(coverId)) {
        coverHref = coverId
        break // exit loop once cover image is found
      }

      if (coverId) {
        const items = contentDoc.getElementsByTagName('item')

        for (let j = 0; j < items.length; j++) {
          const item = items[j]

          if (item.getAttribute('id') === coverId) {
            coverHref = item.getAttribute('href')
            break
          }
        }
      }

      if (coverHref) break
    }
  }

  if (!coverHref) {
    const possibleCovers = [
      'cover.jpg',
      'cover.jpeg',
      'cover.png',
      'images/cover.jpg',
      'images/cover.jpeg',
      'images/cover.png',
      'OEBPS/Images/cover.png' // Based on your .opf example
    ]

    // eslint-disable-next-line no-restricted-syntax
    for (const path of possibleCovers) {
      if (unziped[path]) {
        coverHref = path
        break
      }
    }
  }

  if (!coverHref) {
    throw new Error('Cover image not found in the EPUB.')
  }

  const coverImagePath = resolveRelativePath(fullPath, coverHref)
  const coverData = unziped[coverImagePath]

  if (!coverData) {
    throw new Error(`Cover image file not found at path: ${coverHref}`)
  }

  const mimeType = coverHref.endsWith('.png') ? 'image/png' : 'image/jpeg'
  const fileName = coverHref.split('/').pop() || 'cover'
  const base64 = uint8ArrayToBase64(coverData)

  return {
    metadata,
    coverImage: {
      mimeType,
      base64,
      fileName
    }
  }
}

/**
 * Handle incoming messages from the main thread.
 */
// eslint-disable-next-line no-restricted-globals
self.onmessage = async (e: MessageEvent<WorkerIncomingMessage>) => {
  const { type, payload } = e.data

  if (type === 'extractCoverImage') {
    try {
      const metadata = extractEpubMetadata(payload.epubBuffer)
      const successMessage: WorkerOutgoingMessage = {
        type: 'success',
        payload: metadata
      }
      // eslint-disable-next-line no-restricted-globals
      self.postMessage(successMessage)
    } catch (error) {
      const errorMessage: WorkerOutgoingMessage = {
        type: 'error',
        payload: (error as Error).message || 'Unknown error'
      }
      // eslint-disable-next-line no-restricted-globals
      self.postMessage(errorMessage)
    }
  }
}
