import { generateUUID } from '@/lib/utils';
import { ImageUI } from '@/components/image-ui';

export const maxDuration = 60;

export default function ImagePage() {
  const id = generateUUID();
  return <ImageUI key={id} id={id} />;
}
