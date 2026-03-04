import { generateUUID } from '@/lib/utils';
import { VideoUI } from '@/components/video-ui';

export const maxDuration = 60;

export default function VideoPage() {
  const id = generateUUID();
  return <VideoUI key={id} id={id} />;
}
