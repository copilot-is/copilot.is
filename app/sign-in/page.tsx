import { type Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { cn } from '@/lib/utils';
import { auth } from '@/server/auth';
import { buttonVariants } from '@/components/ui/button';
import { LoginButton } from '@/components/login-button';

export interface SignInPageProps {
  searchParams: {
    error?: string;
  };
}

export const metadata: Metadata = {
  title: 'Login'
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const error = searchParams.error;

  const session = await auth();
  // redirect to home if user is already logged in
  if (session?.user) {
    redirect('/');
  }

  const githubEnabled = process.env.AUTH_GITHUB_ENABLED === 'true';
  const googleEnabled = process.env.AUTH_GOOGLE_ENABLED === 'true';

  return (
    <div className="flex size-full items-center justify-center">
      <div className="mx-3 max-w-md rounded-lg border bg-background p-8 shadow-md">
        {error && (
          <div className="space-y-6">
            <h1 className="px-2 text-center text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
              Oops!
            </h1>
            <div>
              {error === 'OAuthAccountNotLinked'
                ? 'You tried signing in with a different authentication method than the one you used during signup. Please try again using your original authentication method.'
                : 'There was an error during signing in, please try signing in again.'}
            </div>
            <div className="text-center">
              <Link
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'shadow-none'
                )}
                href="/"
              >
                Go back
              </Link>
            </div>
          </div>
        )}
        {!error && (
          <div className="space-y-6">
            <h1 className="px-2 text-center text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
              Sign in to your account
            </h1>

            <LoginButton
              githubEnabled={githubEnabled}
              googleEnabled={googleEnabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}
