import { generateUUID } from '@/lib/utils';
import { VoiceUI } from '@/components/voice-ui';

export const maxDuration = 60;

export default function VoicePage() {
  const id = generateUUID();
  return <VoiceUI key={id} id={id} />;
}
