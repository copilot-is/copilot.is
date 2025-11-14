'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChatDots, Image, Microphone, Video } from '@phosphor-icons/react';

import { ChatType } from '@/types';
import { cn } from '@/lib/utils';

const contentTypes = [
  { type: 'chat' as ChatType, label: 'Chat', icon: ChatDots, path: '/' },
  {
    type: 'voice' as ChatType,
    label: 'Voice',
    icon: Microphone,
    path: '/voice'
  },
  { type: 'image' as ChatType, label: 'Image', icon: Image, path: '/image' },
  { type: 'video' as ChatType, label: 'Video', icon: Video, path: '/video' }
];

export function NewContent() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNewContent = (path: string) => {
    router.push(path);
    router.refresh();
  };

  const isActive = (path: string) => {
    // Only match root path, not paths with IDs
    return pathname === path;
  };

  return (
    <div className="space-y-1 px-3">
      {contentTypes.map(({ type, label, icon: Icon, path }) => {
        const active = isActive(path);
        return (
          <button
            key={type}
            className={cn(
              'group relative flex h-9 w-full items-center gap-2 rounded-md p-2 hover:bg-background hover:shadow-sm dark:hover:bg-accent',
              active && 'bg-background shadow-sm dark:bg-accent'
            )}
            onClick={() => handleNewContent(path)}
          >
            <Icon className="size-5" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
