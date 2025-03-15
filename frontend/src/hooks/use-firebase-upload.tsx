import { logger } from '@lib/logger'
import { storage } from '@lib/storage/storage'
import {
  FullMetadata,
  ref,
  uploadBytesResumable,
  UploadTaskSnapshot
} from 'firebase/storage'
import { useState } from 'react'

import { getCoverMetadata } from '@lib/utils'
import { CoverImage } from '../../types/epub-processor'

interface UseFirebaseUploadReturn {
  isUploading: boolean
  uploadProgress: number
  uploadCoverProgress: number
  uploadFile: (file: File, path: string) => Promise<FullMetadata>
  uploadCover: (file: File, cover: CoverImage) => Promise<FullMetadata>
}

export function useFirebaseUpload(): UseFirebaseUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadCoverProgress, setUploadCoverProgress] = useState(0)

  async function uploadFile(file: File, path: string): Promise<FullMetadata> {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const storageRef = ref(storage, path)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress)
        },
        (error: Error) => {
          logger.error('Firebase error:', error)
          throw error
        }
      )

      const { metadata } = await uploadTask
      return metadata
    } finally {
      setIsUploading(false)
    }
  }

  async function uploadCover(
    file: File,
    cover: CoverImage
  ): Promise<FullMetadata> {
    setIsUploading(true)
    setUploadCoverProgress(0)

    const { coverFile, coverFilename } = getCoverMetadata(file, cover)
    const coverPath = `covers/${coverFilename}`

    try {
      const coverRef = ref(storage, coverPath)
      const uploadTask = uploadBytesResumable(coverRef, coverFile)

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadCoverProgress(progress)
        },
        (error: Error) => {
          logger.error('Firebase cover error:', error)
          throw error
        }
      )

      const { metadata } = await uploadTask
      return metadata
    } finally {
      setIsUploading(false)
    }
  }

  return {
    isUploading,
    uploadProgress,
    uploadCoverProgress,
    uploadFile,
    uploadCover
  }
}
