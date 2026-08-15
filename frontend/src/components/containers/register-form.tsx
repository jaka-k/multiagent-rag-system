'use client'

import { AuthField } from '@components/ui/auth/auth-card'
import { PinGate } from '@components/ui/auth/pin-gate'
import { logger } from '@lib/logger.ts'
import { registerAccount, validateInviteCode } from '@lib/session/auth.ts'
import { LoaderCircle, Plus } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

export function RegisterForm() {
  const [inviteCode, setInviteCode] = React.useState('')
  const [agreed, setAgreed] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [formValues, setFormValues] = React.useState({
    name: '',
    email: '',
    password: ''
  })

  const unlocked = inviteCode !== ''

  const [_, dispatch, isPending] = React.useActionState<
    void,
    typeof formValues
    // eslint-disable-next-line @typescript-eslint/no-shadow
  >(async (_, formData) => {
    try {
      await registerAccount({ ...formData, inviteCode })
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error({ err: error }, 'Handled registration error')
        setErrorMessage(error.message)
      } else {
        logger.error(`An unexpected error occurred during register: ${error}`)
      }
    }
  }, undefined as void)

  const setField =
    (field: keyof typeof formValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormValues((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <>
      <PinGate
        unlocked={unlocked}
        validate={validateInviteCode}
        onUnlock={setInviteCode}
      />
      <form
        action={() => dispatch(formValues)}
        className={unlocked ? 'auth-f gated on' : 'auth-f gated'}
        aria-hidden={!unlocked}
      >
        <AuthField
          label="Name"
          name="name"
          placeholder="Emilia Caitlin"
          autoComplete="name"
          value={formValues.name}
          disabled={!unlocked || isPending}
          required
          onChange={setField('name')}
        />
        <AuthField
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoCapitalize="none"
          value={formValues.email}
          disabled={!unlocked || isPending}
          required
          onChange={setField('email')}
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          value={formValues.password}
          disabled={!unlocked || isPending}
          required
          onChange={setField('password')}
        />
        <label className="auth-check">
          <input
            type="checkbox"
            checked={agreed}
            disabled={!unlocked || isPending}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            I agree to the{' '}
            <Link href="/terms" target="_blank">
              Terms of Service
            </Link>{' '}
            and understand that uploaded books stay private to my account.
          </span>
        </label>
        <button
          type="submit"
          className="btn btn-pri auth-cta"
          disabled={!agreed || !unlocked || isPending}
        >
          {isPending ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Create account
        </button>
        {errorMessage && <p className="auth-err">{errorMessage}</p>}
      </form>
      <div className="auth-alt">
        Already registered? <Link href="/login">Sign in</Link>
      </div>
    </>
  )
}
