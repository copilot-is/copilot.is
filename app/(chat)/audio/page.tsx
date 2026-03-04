import { generateUUID } from '@/lib/utils';
import { AudioUI } from '@/components/audio-ui';

export const maxDuration = 60;

export default function VoicePage() {
  const id = generateUUID();
  return <AudioUI key={id} id={id} />;
}
