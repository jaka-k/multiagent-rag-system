import { publicEnv } from '@lib/runtime-config/public-env'
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app'
import { FirebaseStorage, getStorage } from 'firebase/storage'

/** Firebase app, initialised on first use from the runtime public config. */
export function firebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(publicEnv().firebase)
}

export function firebaseStorage(): FirebaseStorage {
  return getStorage(firebaseApp())
}
