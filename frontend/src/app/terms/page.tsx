import { AuthCard } from '@components/ui/auth/auth-card'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'MRAG — Terms of Service',
  description: 'The short, readable version.'
}

export default function TermsPage() {
  return (
    <main className="desk auth-desk">
      <AuthCard
        title="Terms of Service"
        sub="The short, readable version — last updated August 2026."
        wide
      >
        <div className="terms-body scroll">
          <h4>1. Your content</h4>
          <p>
            Books you upload are stored for your account only and are never
            shared, resold, or used to train models. Delete a book and its
            chapters, embeddings and derived cards are removed with it.
          </p>
          <h4>2. Fair use of sources</h4>
          <p>
            You confirm you have the right to upload the EPUBs you index. MRAG
            quotes retrieved passages back to you for personal study;
            redistribution of book content is not permitted.
          </p>
          <h4>3. Generated answers</h4>
          <p>
            Answers and flashcards are machine-generated from your sources and
            can be wrong. Always verify against the cited chapter before relying
            on them.
          </p>
          <h4>4. Sync with Anki</h4>
          <p>
            If you connect Anki, review state is mirrored both ways for your
            decks only. Disconnecting stops the sync and leaves your Anki
            collection untouched.
          </p>
          <h4>5. Account &amp; data</h4>
          <p>
            You can export your cards at any time. To delete your account, email{' '}
            <a href="mailto:info@krajnc.cc">info@krajnc.cc</a> — deletion is
            irreversible and completes within 30 days.
          </p>
          <h4>6. Cookies</h4>
          <p>
            MRAG only sets essential cookies that keep you securely signed in.
            There is no tracking or analytics; disabling them breaks login.
          </p>
        </div>
        <div className="auth-alt">
          <Link href="/register">Create an account</Link> ·{' '}
          <Link href="/login">Back to sign in</Link>
        </div>
      </AuthCard>
    </main>
  )
}
