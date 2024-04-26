'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconGitHub, IconGoogle, IconSpinner } from '@/components/ui/icons'

interface LoginButtonProps extends Omit<ButtonProps, 'children' | 'disabled' | 'onClick'> {
  githubEnabled?: boolean;
  googleEnabled?: boolean;
  className?: string;
}

export function LoginButton({
  githubEnabled = false,
  googleEnabled = false,
  className,
  ...buttonProps
}: LoginButtonProps) {
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null);

  const handleSignIn = (provider: string) => {
    setLoadingProvider(provider);
    signIn(provider, { callbackUrl: '/' });
  };

  return (
    <div className={`${className} flex flex-col space-y-2`}>
      {githubEnabled && (
        <Button
          {...buttonProps}
          variant="outline"
          onClick={() => handleSignIn('github')}
          disabled={loadingProvider !== null}
          className="w-full"
        >
          {loadingProvider === 'github' ? <IconSpinner className="animate-spin" /> : <IconGitHub />}
          <span className="ml-2">Login with GitHub</span>
        </Button>
      )}
      {googleEnabled && (
        <Button
          {...buttonProps}
          variant="outline"
          onClick={() => handleSignIn('google')}
          disabled={loadingProvider !== null}
          className="w-full"
        >
          {loadingProvider === 'google' ? <IconSpinner className="animate-spin" /> : <IconGoogle />}
          <span className="ml-2">Login with Google</span>
        </Button>
      )}
    </div>
  );
}