'use client'

import { AuthField } from '@components/ui/auth/auth-card'
import { useToast } from '@hooks/use-toast'
import { logger } from '@lib/logger.ts'
import { signIn } from '@lib/session/auth.ts'
import { ChevronRight, LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

export function LoginForm() {
  const [errorMessage, setErrorMessage] = React.useState('')
  const [formValues, setFormValues] = React.useState({
    username: '',
    password: ''
  })

  const { toast } = useToast()

  const [_, dispatch, isPending] = React.useActionState<
    void,
    typeof formValues
    // eslint-disable-next-line @typescript-eslint/no-shadow
  >(async (_, formData) => {
    try {
      await signIn(formData)
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error({ err: error }, 'Handled sign in error')
        setErrorMessage(error.message)
      } else {
        logger.error(
          `An unexpected error occurred when trying to login: ${error}`
        )
      }
    }
  }, undefined as void)

  const handleSubmit = () => {
    toast({
      title: 'We use cookies to keep things running smoothly. 🍪',
      description: '(and because we love cookies!)'
    })
    dispatch(formValues)
  }

  return (
    <>
      <form action={handleSubmit} className="auth-f">
        <AuthField
          label="Email"
          name="username"
          placeholder="you@example.com"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          value={formValues.username}
          disabled={isPending}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, username: e.target.value }))
          }
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={formValues.password}
          disabled={isPending}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, password: e.target.value }))
          }
        />
        <button
          type="submit"
          className="btn btn-pri auth-cta"
          disabled={isPending}
        >
          {isPending ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <ChevronRight size={16} />
          )}
          Sign in
        </button>
        {errorMessage && <p className="auth-err">{errorMessage}</p>}
      </form>
      <div className="auth-alt">
        No account yet? <Link href="/register">Create one</Link>
      </div>
    </>
  )
}
