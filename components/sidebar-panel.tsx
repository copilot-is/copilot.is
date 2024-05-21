import * as React from 'react';
import Link from 'next/link';

import { auth } from '@/server/auth';
import { IconPlus } from '@/components/ui/icons';
import { APIKeySettingsDialog } from '@/components/apikey-settings-dialog';
import { ClearHistory } from '@/components/clear-history';
import { GithubLink } from '@/components/github-link';
import { ModelSettingsDialog } from '@/components/model-settings-dialog';
import { SidebarList } from '@/components/sidebar-list';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { getChats } from '@/app/actions';

export async function SidebarPanel() {
  const session = await auth();
  const chats = await getChats();

  return (
    <>
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
        <SidebarList chats={chats} />
      </React.Suspense>
      <div className="flex items-center justify-between p-3">
        <UserMenu user={session?.user} />
        <div className="flex items-center justify-center space-x-1.5">
          <GithubLink />
          <ThemeToggle />
          <APIKeySettingsDialog />
          <ModelSettingsDialog />
          <ClearHistory isEnabled={chats?.length > 0} />
        </div>
      </div>
    </>
  );
}
