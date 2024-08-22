import { generateId } from '@/lib/utils';
import { Chat } from '@/components/chat';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default function IndexPage() {
  const chatId = generateId();

  return <Chat id={chatId} />;
}
