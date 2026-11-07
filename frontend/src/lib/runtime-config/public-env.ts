/**
 * Browser-visible runtime configuration.
 *
 * The server reads these values from its environment on every request and
 * hands them to the browser via <PublicEnvScript /> in the root layout. Nothing
 * is baked in at build time, so one image runs in every environment.
 *
 * Only put values here that are safe to expose publicly.
 */
export interface PublicEnv {
  /** Backend base URL as reachable from the browser (REST, SSE, WebSocket). */
  backendUrl: string
  /** Firebase web app config (public by design; access is enforced by rules). */
  firebase: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
  }
}

declare global {
  interface Window {
    MRAG_PUBLIC_ENV?: PublicEnv
  }
}

/** Server only: build the public config from the process environment. */
export function readPublicEnvFromProcess(): PublicEnv {
  return {
    backendUrl: process.env.BACKEND_PUBLIC_URL || 'http://localhost:8080',
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY ?? '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
      projectId: process.env.FIREBASE_PROJECT_ID ?? '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
      appId: process.env.FIREBASE_APP_ID ?? ''
    }
  }
}

/**
 * Public config for the current runtime. Call it where the value is used
 * (inside hooks/functions), not at module load, so the injected script has run.
 */
export function publicEnv(): PublicEnv {
  if (typeof window === 'undefined') {
    return readPublicEnvFromProcess()
  }

  const env = window.MRAG_PUBLIC_ENV

  if (!env) {
    throw new Error(
      'Public runtime config missing: <PublicEnvScript /> is not rendered'
    )
  }

  return env
}
