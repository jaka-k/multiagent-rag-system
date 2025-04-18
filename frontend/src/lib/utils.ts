import { logger } from '@lib/logger.ts'
import { CoverImage } from '@mytypes/epub-processor'
import { type ClassValue, clsx } from 'clsx'
import { FullMetadata } from 'firebase/storage'
import { ReadyState } from 'react-use-websocket'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function connectionStatusMapping(readyState: ReadyState) {
  return {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated'
  }[readyState]
}

export function estimateTokensAndCost(fileSize: number): {
  tokens: number
  cost: number
} {
  const estimatedTokens = Math.floor(fileSize / 4) // rough estimate: 1 token ≈ 4 bytes
  const costPerThousandTokens = 0.0001 // €0.0001 per 1K tokens
  const estimatedCost = (estimatedTokens / 1000) * costPerThousandTokens
  return {
    tokens: estimatedTokens,
    cost: estimatedCost
  }
}

export function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64) // Decode Base64
    const len = binaryString.length
    const bytes = new Uint8Array(len)

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    return bytes
  } catch (error) {
    logger.error('Base64 decoding failed:', error)
    return new Uint8Array()
  }
}

const imageMimeToExtension: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/heif': 'heif',
  'image/heic': 'heic',
  'image/avif': 'avif',
  'image/jxr': 'jxr',
  'image/vnd.adobe.photoshop': 'psd'
}

export function getImageExtension(mimeType: string): string | undefined {
  return imageMimeToExtension[mimeType]
}

export function noSpaceFilename(filename: string): string {
  return filename.toLowerCase().replaceAll(' ', '-')
}

export function getCoverMetadata(
  epubFile: File,
  coverImage: CoverImage
): { coverFile: File; coverFilename: string } {
  if (!coverImage?.mimeType) {
    logger.warn('MIME type is undefined. Cannot determine file extension.')
  }

  if (!coverImage?.base64) {
    logger.warn('Cover image base64 is undefined or empty.')
  }

  const type = coverImage?.mimeType || 'image/png'
  const ext = getImageExtension(type) ?? 'png'
  const coverFilename = `${noSpaceFilename(epubFile.name.split('.')[0])}.${ext}`

  const blobData = base64ToUint8Array(coverImage?.base64 || '')
  const blob = new Blob([blobData], {
    type
  })
  const coverFile = new File([blob], coverFilename, {
    type
  })
  return {
    coverFile,
    coverFilename
  }
}

export function createPersistentDownloadUrl(metadata: FullMetadata) {
  const { bucket, fullPath, downloadTokens } = metadata
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
    fullPath
  )}?alt=media&token=${downloadTokens?.[0]}`
}
