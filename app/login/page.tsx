import { type Metadata } from 'next';
import Link from 'next/link';
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
              AI Chatbot
            </h1>
            <p className="text-sm text-muted-foreground">
              Supporting OpenAI, Google Gemini, Claude, and Grok.
            </p>
          </div>
          <div className="space-y-4 rounded-xl border p-6 shadow-lg">
            <LoginButton github={GITHUB_ENABLED} google={GOOGLE_ENABLED} />
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              By signing in, you agree to our{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-primary"
              >
                Privacy Policy
              </Link>
              {', '}
              This is an open source project{' '}
              <a
                href="https://github.com/copilot-is/copilot.is"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-primary"
              >
                View on GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
