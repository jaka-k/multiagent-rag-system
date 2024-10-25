'use client'

import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import { signIn } from '@lib/auth'
import { LoaderCircle } from 'lucide-react'
import * as React from 'react'
import { useFormState } from 'react-dom'

import { cn } from '@/lib/utils'
import { useToast } from '@hooks/use-toast'

type ButtonEvent =
  | React.MouseEvent<HTMLButtonElement>
  | React.TouchEvent<HTMLButtonElement>

export function UserAuthForm() {
  const [errorMessage, setErrorMessage] = React.useState('')
  const [formValues, setFormValues] = React.useState({
    username: '',
    password: ''
  })

  const { toast } = useToast()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  const [state, dispatch, isPending] = useFormState<void, typeof formValues>(
    async (_, formData) => {
      try {
        await signIn(formData)
      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('An unexpected error occurred')
        }
      }
    },
    undefined as void
  )

  const handleSubmit = () => {
    toast({
      title: 'We use cookies to keep things running smoothly. 🍪',
      description: '(and because we love cookies!)'
    })
    dispatch(formValues)
  }

  return (
    <div className={cn('grid gap-6')}>
      <form action={handleSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-2">
            <Label className="sr-only" htmlFor="username">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              placeholder="Username"
              type="text"
              value={formValues.username}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  username: e.target.value
                }))
              }
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect="off"
              disabled={isPending}
            />
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              placeholder="Password"
              type="password"
              value={formValues.password}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  password: e.target.value
                }))
              }
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect="off"
              disabled={isPending}
            />
            <Button
              aria-disabled={isPending}
              type="submit"
              onClick={(event: ButtonEvent) =>
                isPending ? event.preventDefault() : undefined
              }
            >
              {isPending && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              Login
            </Button>
          </div>
        </div>
      </form>
      {errorMessage && <p className="error">{errorMessage}</p>}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            No access ?
          </span>
        </div>
      </div>
      <div className="text-sm text-muted-foreground text-center">
        Currently, the product is in alpha testing. If you would like access,
        please apply by emailing us at{' '}
        <a
          href="mailto:info@krajnc.cc"
          className="underline underline-offset-4 hover:text-primary"
        >
          info@krajnc.cc
        </a>
      </div>
    </div>
  )
}
