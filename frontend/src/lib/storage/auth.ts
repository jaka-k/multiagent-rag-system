import { getAuth, signInWithCustomToken } from 'firebase/auth'
import { app } from './storage'
import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'

const firebaseAuth = getAuth(app)

/**
 * Exchanges the current FastAPI JWT for a Firebase Custom Token and signs in
 * to Firebase Auth. This gives the Firebase SDK a valid auth session so that
 * Storage Security Rules (`request.auth != null`) are satisfied.
 *
 * The function is idempotent: if the user is already signed in it returns
 * immediately, so it is safe to call before every upload.
 */
export async function signInToFirebase(): Promise<void> {
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

export { firebaseAuth }
