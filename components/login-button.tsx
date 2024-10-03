'use client';

import * as React from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { signIn } from 'next-auth/react';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { IconGitHub, IconGoogle } from '@/components/ui/icons';

interface LoginButtonProps
  extends Omit<ButtonProps, 'children' | 'disabled' | 'onClick'> {
  github?: boolean;
  google?: boolean;
  className?: string;
}

export function LoginButton({
  github = false,
  google = false,
  className,
  ...buttonProps
}: LoginButtonProps) {
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(
    null
  );

  const handleSignIn = (provider: string) => {
    setLoadingProvider(provider);
    signIn(provider, { callbackUrl: '/' });
  };

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {github && (
        <Button
          {...buttonProps}
          variant="outline"
          size="lg"
          onClick={() => handleSignIn('github')}
          disabled={loadingProvider !== null}
          className="w-full"
        >
          {loadingProvider === 'github' ? (
            <CircleNotch className="size-4 animate-spin" />
          ) : (
            <IconGitHub className="size-4" />
          )}
          <span className="ml-2">Login with GitHub</span>
        </Button>
      )}

      {google && (
        <Button
          {...buttonProps}
          variant="outline"
          size="lg"
          onClick={() => handleSignIn('google')}
          disabled={loadingProvider !== null}
          className="w-full"
        >
          {loadingProvider === 'google' ? (
            <CircleNotch className="size-4 animate-spin" />
          ) : (
            <IconGoogle className="size-4" />
          )}
          <span className="ml-2">Login with Google</span>
        </Button>
      )}
    </div>
  );
}
