import { Metadata } from 'next'

import { auth } from '@/auth'
import { LoginButton } from '@/components/login-button'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Login'
}

export default async function SignInPage() {
  const session = await auth()
  // redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }
  return (
    <div className="flex h-full items-center justify-center">
      <LoginButton />
    </div>
  )
}
