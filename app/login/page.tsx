import { type Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/server/auth';
import { LoginButton } from '@/components/login-button';

export const metadata: Metadata = {
  title: 'Sign in'
};

const GITHUB_ENABLED = process.env.AUTH_GITHUB_ENABLED === 'true';
const GOOGLE_ENABLED = process.env.AUTH_GOOGLE_ENABLED === 'true';

export default async function Page() {
  const session = await auth();
  // redirect to home if user is already logged in
  if (session?.user) {
    redirect('/');
  }

  return (
    <div className="flex size-full items-center justify-center">
      <div className="mx-6 w-full sm:w-[350px]">
        <div className="space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in to your account
            </h1>
          </div>
          <LoginButton github={GITHUB_ENABLED} google={GOOGLE_ENABLED} />
        </div>
      </div>
    </div>
  );
}
