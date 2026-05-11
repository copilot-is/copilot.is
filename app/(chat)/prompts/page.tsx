import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { PromptsPage } from './prompts-client';
import { auth } from '@/server/auth';

export const metadata: Metadata = {
  title: 'Prompts'
};

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <PromptsPage />;
}
