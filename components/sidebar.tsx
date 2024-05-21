'use client';

import * as React from 'react';

import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useSidebar } from '@/lib/hooks/use-sidebar';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  children?: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
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
        {children}
      </section>
    </>
  );
}
