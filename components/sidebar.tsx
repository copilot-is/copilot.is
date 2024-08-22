'use client';

import * as React from 'react';
import Link from 'next/link';

import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useSidebar } from '@/lib/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import { IconPlus } from '@/components/ui/icons';
import { APIKeySettingsDialog } from '@/components/apikey-settings-dialog';
import { ClearHistory } from '@/components/clear-history';
import { GithubLink } from '@/components/github-link';
import { ModelSettingsDialog } from '@/components/model-settings-dialog';
import { SidebarList } from '@/components/sidebar-list';
import { ThemeToggle } from '@/components/theme-toggle';
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
            className="flex h-10 w-full items-center rounded-md border border-input bg-zinc-50 px-4 py-2 text-sm font-medium shadow-none ring-offset-background transition-colors hover:bg-zinc-200/40 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-900 dark:hover:bg-zinc-300/10"
          >
            <IconPlus className="-translate-x-2" />
            New Chat
          </Link>
        </div>
        <React.Suspense
          fallback={
            <div className="flex-1 overflow-auto">
              <div className="space-y-2 px-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800"
                  />
                ))}
              </div>
            </div>
          }
        >
          <SidebarList />
        </React.Suspense>
        <div className="flex items-center justify-between p-3">
          <UserMenu />
          <div className="flex items-center justify-center space-x-1.5">
            <GithubLink />
            <ThemeToggle />
            <APIKeySettingsDialog />
            <ModelSettingsDialog />
            <ClearHistory />
          </div>
        </div>
      </section>
    </>
  );
}
