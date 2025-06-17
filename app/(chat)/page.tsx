import { generateUUID } from '@/lib/utils';
import { ChatUI } from '@/components/chat-ui';

export const maxDuration = 60;

export default function Page() {
  const id = generateUUID();

  return <ChatUI id={id} />;
}
