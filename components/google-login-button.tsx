'use client';

import * as React from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { signIn } from 'next-auth/react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { IconGoogle } from '@/components/ui/icons';

interface GoogleLoginButtonProps
  extends Omit<ButtonProps, 'children' | 'disabled' | 'onClick'> {
  loading?: string | null;
  setLoading?: (provider: string | null) => void;
}

export function GoogleLoginButton({
  loading = null,
  setLoading,
  ...buttonProps
}: GoogleLoginButtonProps) {
  const disabled = loading !== null;

  const handleSignIn = () => {
    setLoading?.('google');
    signIn('google', { callbackUrl: '/' });
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
      {loading === 'google' ? (
        <CircleNotch className="size-4 animate-spin" />
      ) : (
        <IconGoogle className="size-4" />
      )}
      <span className="ml-2">Continue with Google</span>
    </Button>
  );
}
