import { LoginForm } from '@components/containers/login-form'
import { AuthCard } from '@components/ui/auth/auth-card'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MRAG — Sign in',
  description: 'Sign in to your library, chats and flashcards.'
}

export default function LoginPage() {
  return (
    <main className="desk auth-desk">
      <AuthCard
        title="Welcome back"
        sub="Sign in to your library, chats and flashcards."
      >
        <LoginForm />
      </AuthCard>
    </main>
  )
}
