import { storage } from '@lib/storage/storage'
import { ref, uploadBytesResumable, UploadTaskSnapshot } from 'firebase/storage'
import React from 'react'

export async function uploadToFirebase(
  file: File,
  setUploadProgress: React.Dispatch<React.SetStateAction<number>>
) {
  const storageRef = ref(storage, `epubs/${file.name}`)

  setUploadProgress(0)

  try {
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setUploadProgress(progress)
      },
      (error: Error) => {
        console.log(error)
      }
    )
  } catch (error) {
    console.log(error)
  }
}
