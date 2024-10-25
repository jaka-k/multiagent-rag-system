import { UserAuthForm } from '@components/containers/user-auth-form'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Anki Tutor - Authentication Page',
  description:
    'Authentication form for multiagent rag system called: Anki Tutor'
}

export default function AuthenticationPage() {
  return (
    <>
      <div className="absolute h-full w-full flex-col p-10 text-black dark:border-r">
        <div className="lg:p-8 h-full w-full flex flex-col justify-center items-center">
          <div className="mx-auto flex h-full w-full flex-col justify-center space-y-6 sm:w-[350px] ">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Enter your credentials
              </h1>
              <p className="text-sm text-muted-foreground">
                Please use the username and password provided to you.
              </p>
            </div>
            <UserAuthForm />
          </div>
          <p className="px-12 text-center text-sm text-muted-foreground mt-auto">
            By clicking login, you agree to our{' '}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  )
}
