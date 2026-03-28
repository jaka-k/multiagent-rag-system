import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { firebaseConfig } from './config'

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app)

export { storage }
