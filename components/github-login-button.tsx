'use client';

import * as React from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { signIn } from 'next-auth/react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { IconGitHub } from '@/components/ui/icons';

interface GitHubLoginButtonProps
  extends Omit<ButtonProps, 'children' | 'disabled' | 'onClick'> {
  loading?: string | null;
  setLoading?: (provider: string | null) => void;
}

export function GitHubLoginButton({
  loading = null,
  setLoading,
  ...buttonProps
}: GitHubLoginButtonProps) {
  const disabled = loading !== null;

  const handleSignIn = () => {
    setLoading?.('github');
    signIn('github', { callbackUrl: '/' });
  };

  return (
    <Button
      {...buttonProps}
      variant="outline"
      size="lg"
      onClick={handleSignIn}
      disabled={disabled}
      className="w-full"
    >
      {loading === 'github' ? (
        <CircleNotch className="size-4 animate-spin" />
      ) : (
        <IconGitHub className="size-4" />
      )}
      <span className="ml-2">Continue with GitHub</span>
    </Button>
  );
}
