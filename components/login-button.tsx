'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconGitHub, IconGoogle, IconSpinner } from '@/components/ui/icons'

interface LoginButtonProps
  extends Omit<ButtonProps, 'children' | 'disabled' | 'onClick'> {
  githubEnabled?: boolean
  googleEnabled?: boolean
  className?: string
}

export function LoginButton({
  githubEnabled = false,
  googleEnabled = false,
  className,
  ...buttonProps
}: LoginButtonProps) {
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(
    null
  )

  const handleSignIn = (provider: string) => {
    setLoadingProvider(provider)
    signIn(provider, { callbackUrl: '/' })
  }

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {githubEnabled && (
        <Button
          {...buttonProps}
          variant="outline"
          size="lg"
          onClick={() => handleSignIn('github')}
          disabled={loadingProvider !== null}
          className="w-full shadow-none"
        >
          {loadingProvider === 'github' ? (
            <IconSpinner className="size-5 animate-spin" />
          ) : (
            <IconGitHub className="size-5" />
          )}
          <span className="ml-2">Login with GitHub</span>
        </Button>
      )}

      {googleEnabled && (
        <Button
          {...buttonProps}
          variant="outline"
          size="lg"
          onClick={() => handleSignIn('google')}
          disabled={loadingProvider !== null}
          className="w-full shadow-none"
        >
          {loadingProvider === 'google' ? (
            <IconSpinner className="size-5 animate-spin" />
          ) : (
            <IconGoogle className="size-5" />
          )}
          <span className="ml-2">Login with Google</span>
        </Button>
      )}
    </div>
  )
}
