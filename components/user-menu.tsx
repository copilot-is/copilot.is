'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowSquareOut,
  CaretDown,
  ClockCounterClockwise,
  Gear,
  GithubLogo,
  Key,
  Monitor,
  Moon,
  PaintBrush,
  SignOut,
  Sun
} from '@phosphor-icons/react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import { useStore } from '@/store/useStore';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ClearHistoryDialog } from '@/components/clear-history-dialog';
import { SettingsAPIDialog } from '@/components/settings-api-dialog';
import { SettingsDialog } from '@/components/settings-dialog';

export function UserMenu() {
  const { user, setUser } = useStore();
  const { theme, setTheme } = useTheme();
  const { apiCustomEnabled } = useSettings();
  const [isLoading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isAPIDialogOpen, setIsAPIDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const result = await api.getCurrentUser();
      if (result && !('error' in result)) {
        setUser(result);
      }
      setLoading(false);
    };

    fetchUser();
  }, [setUser]);

  return (
    <div className="flex items-center p-3">
      {isLoading ? (
        <div className="flex w-full items-center rounded-md border bg-background p-2 shadow-sm">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-col pl-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-32" />
          </div>
        </div>
      ) : (
        user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="group" asChild>
              <div
                tabIndex={0}
                className="flex w-full cursor-pointer items-center rounded-md border bg-background p-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <div className="size-8 overflow-hidden rounded-full border">
                  <Image
                    className="size-full object-cover"
                    src={user.image ? `${user.image}` : ''}
                    alt={user.name ?? ''}
                    height={32}
                    width={32}
                  />
                </div>
                <div className="mx-2 flex flex-1 flex-col items-start text-xs">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
                <CaretDown className="size-4 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[255px] lg:w-[225px] xl:w-[275px]">
              <DropdownMenuItem
                className="flex items-center"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Gear className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              {apiCustomEnabled && (
                <DropdownMenuItem
                  className="flex items-center"
                  onClick={() => setIsAPIDialogOpen(true)}
                >
                  <Key className="mr-2 size-4" />
                  API Customization
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="flex items-center"
                onClick={() => setIsHistoryOpen(true)}
              >
                <ClockCounterClockwise className="mr-2 size-4" />
                Clear history
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center justify-between"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsAppearanceOpen(prev => !prev);
                }}
              >
                <div className="flex items-center">
                  <PaintBrush className="mr-2 size-4" />
                  Appearance
                </div>
                <CaretDown
                  className={cn(
                    'size-4 transition-transform',
                    isAppearanceOpen ? 'rotate-180' : ''
                  )}
                />
              </DropdownMenuItem>
              <DropdownMenuGroup
                className={cn(
                  'transition-transform',
                  !isAppearanceOpen ? 'hidden' : ''
                )}
              >
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  className="flex items-center"
                  checked={theme === 'system'}
                  onCheckedChange={() => setTheme('system')}
                >
                  <Monitor className="mr-2 size-4" />
                  System
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  className="flex items-center"
                  checked={theme === 'light'}
                  onCheckedChange={() => setTheme('light')}
                >
                  <Sun className="mr-2 size-4" />
                  Light
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  className="flex items-center"
                  checked={theme === 'dark'}
                  onCheckedChange={() => setTheme('dark')}
                >
                  <Moon className="mr-2 size-4" />
                  Dark
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a
                  href="https://github.com/copilot-is/copilot.is"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-between px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <div className="flex items-center">
                    <GithubLogo className="mr-2 size-4" />
                    GitHub
                  </div>
                  <ArrowSquareOut className="size-4" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  signOut({
                    callbackUrl: '/'
                  })
                }
                className="flex items-center"
              >
                <SignOut className="mr-2 size-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      )}
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <SettingsAPIDialog
        open={isAPIDialogOpen}
        onOpenChange={setIsAPIDialogOpen}
      />
      <ClearHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />
    </div>
  );
}
