'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Image, MessageSquare, Mic, Video } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

const contentTypes = [
  { type: 'chat', label: 'Chat', icon: MessageSquare, path: '/' },
  { type: 'audio', label: 'Audio', icon: Mic, path: '/audio' },
  { type: 'image', label: 'Image', icon: Image, path: '/image' },
  { type: 'video', label: 'Video', icon: Video, path: '/video' }
] as const;

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
    <SidebarGroup className="mt-2">
      <SidebarGroupContent>
        <SidebarMenu>
          {contentTypes.map(({ type, label, icon: Icon, path }) => {
            const active = isActive(path);
            return (
              <SidebarMenuItem key={type}>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={label}
                  onClick={() => handleNewContent(path)}
                  className="hover:bg-background hover:shadow-sm data-[active=true]:bg-background data-[active=true]:shadow-sm dark:hover:bg-accent dark:data-[active=true]:bg-accent"
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
