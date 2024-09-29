'use client';

import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useSidebar } from '@/hooks/use-sidebar';
import { IconPlus } from '@/components/ui/icons';
import { SidebarList } from '@/components/sidebar-list';
import { UserMenu } from '@/components/user-menu';

export function Sidebar() {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const { isSidebarOpen, closeSidebar } = useSidebar();

  return (
    <>
      {isMobile && isSidebarOpen && (
        <div
          className="fixed left-0 top-0 z-20 size-full bg-background/60 backdrop-blur-sm"
          onClick={closeSidebar}
        ></div>
      )}
      <section
        data-state={isSidebarOpen ? 'open' : 'closed'}
        className={cn(
          'peer absolute inset-y-0 z-30 h-full w-[280px] -translate-x-full flex-col border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 dark:bg-zinc-950 lg:flex lg:w-[250px] xl:w-[300px]',
          isMobile ? 'flex' : 'hidden'
        )}
        onClick={isMobile ? closeSidebar : undefined}
      >
        <div className="flex p-3">
          <Link
            href="/"
            className="flex w-full items-center rounded-md border border-input bg-slate-50 px-4 py-2 text-sm font-medium transition-colors hover:border-slate-300 hover:bg-slate-200/40 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-900 dark:hover:bg-slate-300/10"
          >
            <IconPlus className="-translate-x-2" />
            New Chat
          </Link>
        </div>
        <SidebarList />
        <UserMenu />
      </section>
    </>
  );
}
