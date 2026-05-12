import { Metadata } from 'next';

import { UserPrompt } from '@/components/user-prompt';

export const metadata: Metadata = {
  title: 'Prompt Settings'
};

export default function PromptSettingsPage() {
  return <UserPrompt />;
}
