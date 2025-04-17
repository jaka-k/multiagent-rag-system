import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage' // TODO: Replace the following with your app's Firebase project configuration

// TODO: Replace the hardcoded variables
// See: https://firebase.google.com/docs/web/learn-more#config-object

// Initialize Firebase
const app = initializeApp({
  apiKey: 'AIzaSyBxbHGfoYm3CslrrSI7kI12rAT45C1IsnA',
  authDomain: 'ninja-firegram-49725.firebaseapp.com',
  projectId: 'ninja-firegram-49725',
  storageBucket: 'ninja-firegram-49725.firebasestorage.app',
  messagingSenderId: '733678938064',
  appId: '1:733678938064:web:36a94133bf0ef873043bd5'
})

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app)

export { storage }
