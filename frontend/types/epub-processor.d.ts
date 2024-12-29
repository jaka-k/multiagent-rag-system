/**
 * Message from the main thread to the worker.
 */
export interface ExtractCoverImageMessage {
  type: 'extractCoverImage'
  payload: {
    epubBuffer: ArrayBuffer
  }
}

/**
 * Successful response from the worker to the main thread.
 */
export interface SuccessMessage {
  type: 'success'
  payload: CoverImage
}

/**
 * Error response from the worker to the main thread.
 */
export interface ErrorMessage {
  type: 'error'
  payload: string
}

/**
 * Union type for messages sent to the worker.
 */
export type WorkerIncomingMessage = ExtractCoverImageMessage

/**
 * Union type for messages sent from the worker.
 */
export type WorkerOutgoingMessage = SuccessMessage | ErrorMessage

/**
 * Interface for the extracted cover image.
 */
export interface CoverImage {
  mimeType: string
  base64: string
  fileName: string
}

export interface Metadata {
  title?: string
  creator?: string
  publisher?: string
  description?: string
  // Add more fields as needed
}

/**
 * Combined interface for all extracted data.
 */
export interface EpubMetadata {
  coverImage: CoverImage
  metadata: Metadata
}
