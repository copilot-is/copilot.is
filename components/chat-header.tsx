'use client';

import Link from 'next/link';
import { PlusCircle } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { ModelMenu } from '@/components/model-menu';
import { SidebarToggle } from '@/components/sidebar-toggle';

export function ChatHeader() {
  return (
    <div className="sticky top-0 z-10 flex w-full items-center bg-background p-3">
      <SidebarToggle />
      <ModelMenu />
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-9 lg:hidden [&_svg]:size-6'
        )}
      >
        <PlusCircle />
        <span className="sr-only">New Chat</span>
      </Link>
    </div>
  );
}
