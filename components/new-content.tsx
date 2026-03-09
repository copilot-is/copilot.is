'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { contentTypes } from '@/lib/content-types';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

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
