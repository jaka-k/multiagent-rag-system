import { RegisterForm } from '@components/containers/register-form'
import { AuthCard } from '@components/ui/auth/auth-card'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MRAG — Create your account',
  description: 'MRAG is in private beta. Your invite code unlocks registration.'
}

export default function RegisterPage() {
  return (
    <main className="desk auth-desk">
      <AuthCard
        title="Create your account"
        sub="MRAG is in private beta. Your invite code unlocks registration."
      >
        <RegisterForm />
      </AuthCard>
    </main>
  )
}
