import './globals.css'
// TODO: handle locally
// eslint-disable-next-line import/no-unresolved
import 'highlight.js/styles/nnfx-light.css'

import { Toaster } from '@components/ui/toaster'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Anki Tutor',
  description: 'Use flashcards and LLMs to streamline your learning process.'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
