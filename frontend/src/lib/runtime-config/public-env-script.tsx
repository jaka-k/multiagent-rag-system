import { connection } from 'next/server'

import { readPublicEnvFromProcess } from './public-env'

/**
 * Injects the public runtime config as `window.MRAG_PUBLIC_ENV`.
 * `connection()` opts the page into per-request rendering, so the values come
 * from the running container's environment rather than the build machine's.
 */
export async function PublicEnvScript() {
  await connection()

  // Escape `<` so a value can never close the script tag.
  const json = JSON.stringify(readPublicEnvFromProcess()).replace(
    /</g,
    '\\u003c'
  )

  return (
    <script
      id="public-env"
      dangerouslySetInnerHTML={{ __html: `window.MRAG_PUBLIC_ENV=${json}` }}
    />
  )
}
