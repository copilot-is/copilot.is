import { nanoid } from '@/lib/utils';
import { Chat } from '@/components/chat';

export const maxDuration = 60;

export default function IndexPage() {
  const id = nanoid();

  return <Chat id={id} />;
}
