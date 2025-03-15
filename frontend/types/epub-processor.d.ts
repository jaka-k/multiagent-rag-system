export interface ExtractCoverImageMessage {
  type: 'extractCoverImage'
  payload: {
    epubBuffer: ArrayBuffer
  }
}

export interface SuccessMessage {
  type: 'success'
  payload: EpubMetadata
}

export interface ErrorMessage {
  type: 'error'
  payload: string
}

export type WorkerIncomingMessage = ExtractCoverImageMessage

export type WorkerOutgoingMessage = SuccessMessage | ErrorMessage

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
}

export interface EpubMetadata {
  coverImage: CoverImage | undefined
  metadata: Metadata
}
