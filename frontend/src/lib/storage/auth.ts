import { Auth, getAuth, signInWithCustomToken } from 'firebase/auth'
import { app } from './storage'
import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'

// Lazy-initialised — getAuth(app) must not run at module load time because
// Next.js evaluates this module during SSR/prerendering where Firebase Auth
// is not available and NEXT_PUBLIC_* vars are not injected.
let _auth: Auth | null = null

function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(app)
  }
  return _auth
}

/**
 * Exchanges the current FastAPI JWT for a Firebase Custom Token and signs in
 * to Firebase Auth. This gives the Firebase SDK a valid auth session so that
 * Storage Security Rules (`request.auth != null`) are satisfied.
 *
 * The function is idempotent: if the user is already signed in it returns
 * immediately, so it is safe to call before every upload.
 */
export async function signInToFirebase(): Promise<void> {
  const firebaseAuth = getFirebaseAuth()

  // Wait for Firebase to restore any persisted session from indexedDB before
  // checking currentUser. Without this, currentUser is always null on page load
  // even if a valid session already exists, causing an unnecessary token fetch.
  await firebaseAuth.authStateReady()

  if (firebaseAuth.currentUser) {
    return
  }

  const response = await fetchWithAuth<{ firebase_token: string }>(
    '/auth/firebase-token',
    { method: 'GET' }
  )

  if (!response.ok) {
    throw new Error('Failed to obtain Firebase token from backend')
  }

  await signInWithCustomToken(firebaseAuth, response.data.firebase_token)
}
