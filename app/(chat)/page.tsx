'use client';

import { generateId } from '@/lib/utils';
import { ChatQuick } from '@/components/chat-quick';

export const maxDuration = 60;

export default function IndexPage() {
  const chatId = generateId();

  return <ChatQuick id={chatId} />;
}
