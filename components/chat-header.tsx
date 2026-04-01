'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSystemSettings } from '@/contexts/system-settings-context';
import { PlusCircle } from 'lucide-react';

import { contentTypes } from '@/lib/content-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface ChatHeaderProps {
  title?: string;
}

export function ChatHeader({ title }: ChatHeaderProps) {
  const { appName } = useSystemSettings();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const handleNewContent = (path: string) => {
    router.push(path);
    router.refresh();
  };

  useEffect(() => {
    const documentTitle = title ? `${title} - ${appName}` : appName;

    if (documentTitle !== document.title) {
      document.title = documentTitle;
    }
  }, [title, appName]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center justify-center truncate px-1 font-semibold">
        {title}
      </div>
      {mounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-ml-1 size-7 lg:hidden"
            >
              <PlusCircle />
              <span className="sr-only">New content</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {contentTypes.map(({ type, label, icon: Icon, path }) => (
              <DropdownMenuItem
                key={type}
                onSelect={() => handleNewContent(path)}
                className={cn(
                  pathname === path && 'bg-accent text-accent-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-4" />
                  <span>{label}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="ghost" size="icon" className="-ml-1 size-7 lg:hidden">
          <PlusCircle />
          <span className="sr-only">New content</span>
        </Button>
      )}
    </header>
  );
}
