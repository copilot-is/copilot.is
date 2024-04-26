import { type Metadata } from 'next'
import { redirect } from 'next/navigation'

import { auth } from '@/server/auth'
import { LoginButton } from '@/components/login-button'

export const metadata: Metadata = {
  title: 'Login'
}

export default async function SignInPage() {
  const session = await auth()
  // redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }

  const githubEnabled = process.env.AUTH_GITHUB_ENABLED === 'true';
  const googleEnabled = process.env.AUTH_GOOGLE_ENABLED === 'true';

  return (
    <div className="flex h-full items-center justify-center">
      <LoginButton githubEnabled={githubEnabled} googleEnabled={googleEnabled} />
    </div>
  )
}