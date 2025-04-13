import { Metadata } from '@types/epub-processor'

export function resolveRelativePath(
  basePath: string,
  relativePath: string
): string {
  const baseParts = basePath.split('/')
  baseParts.pop()

  const relativeParts = relativePath.split('/')

  // eslint-disable-next-line no-restricted-syntax
  for (const part of relativeParts) {
    if (part === '..') {
      baseParts.pop()
    } else if (part !== '.' && part !== '') {
      baseParts.push(part)
    }
  }

  return baseParts.join('/')
}

export function uint8ArrayToBase64(buffer: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000 // 32768 characters per chunk

  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }

  return btoa(binary)
}

export function extractMetadata(contentDoc: Document): Metadata {
  const getText = (tagName: string): string | undefined => {
    const elements = contentDoc.getElementsByTagName(tagName)

    if (elements.length > 0) {
      return elements[0].textContent?.trim() || undefined
    }

    return undefined
  }

  const title = getText('dc:title') || getText("docTitle")
  const creator = getText('dc:creator') || getText("docCreator") || getText("docAuthor")
  const publisher = getText('dc:publisher')
  const description = getText('dc:description')

  return {
    title,
    creator,
    publisher,
    description
  }
}
