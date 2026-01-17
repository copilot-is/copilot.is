'use client';

import * as React from 'react';
import { CircleNotch, EnvelopeSimple } from '@phosphor-icons/react';
import { signIn } from 'next-auth/react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';

interface EmailLoginFormProps {
  className?: string;
  loading?: string | null;
  setLoading?: (provider: string | null) => void;
}

export function EmailLoginForm({
  className,
  loading = null,
  setLoading
}: EmailLoginFormProps) {
  const disabled = loading !== null && loading !== 'email';
  const [step, setStep] = React.useState<'email' | 'code'>('email');
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setLoading?.('email');

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code');
        return;
      }

      setStep('code');
      setCountdown(60);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn('email-code', {
        email,
        code,
        callbackUrl: '/',
        redirect: false
      });

      if (result?.error) {
        setError('Invalid or expired verification code');
        return;
      }

      if (result?.ok) {
        window.location.href = '/';
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend code');
        return;
      }

      setCountdown(60);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {step === 'email' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="relative">
            <EnvelopeSimple className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="pl-10"
              required
              disabled={disabled || isLoading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={disabled || isLoading || !email}
          >
            {isLoading ? (
              <CircleNotch className="size-4 animate-spin" />
            ) : (
              <EnvelopeSimple className="size-4" />
            )}
            <span className="ml-2">Continue with Email</span>
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            We sent a verification code to{' '}
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <OtpInput
            value={code}
            onChange={setCode}
            length={6}
            disabled={isLoading}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? (
              <CircleNotch className="size-4 animate-spin" />
            ) : (
              'Verify & Sign In'
            )}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setError(null);
                setLoading?.(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Change email
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={countdown > 0 || isLoading}
              className={cn(
                'text-muted-foreground',
                countdown > 0 ? 'cursor-not-allowed' : 'hover:text-foreground'
              )}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
