import { Image, MessageSquare, Mic, Video } from 'lucide-react';

export const contentTypes = [
  { type: 'chat', label: 'Chat', icon: MessageSquare, path: '/' },
  { type: 'audio', label: 'Audio', icon: Mic, path: '/audio' },
  { type: 'image', label: 'Image', icon: Image, path: '/image' },
  { type: 'video', label: 'Video', icon: Video, path: '/video' }
] as const;
