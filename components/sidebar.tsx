'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSystemSettings } from '@/contexts/system-settings-context';

import { Separator } from '@/components/ui/separator';
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
  SidebarRail
} from '@/components/ui/sidebar';
import { NewContent } from '@/components/new-content';
import { SidebarList } from '@/components/sidebar-list';
import { UserMenu } from '@/components/user-menu';

export function Sidebar({
  ...props
}: React.ComponentProps<typeof SidebarPrimitive>) {
  const { appName } = useSystemSettings();

  return (
    <SidebarPrimitive collapsible="icon" {...props}>
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="gap-1 p-0 hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent active:text-sidebar-foreground"
            >
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <img src="/favicon.svg" alt="Logo" className="size-7" />
                </div>
                <div className="grid flex-1 text-left text-lg font-medium group-data-[collapsible=icon]:hidden">
                  <span className="truncate">{appName}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NewContent />
        <div className="px-2">
          <Separator className="bg-sidebar-border" />
        </div>
        <SidebarList />
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </SidebarPrimitive>
  );
}
