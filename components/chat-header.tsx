'use client';

import Link from 'next/link';

import { type Chat } from '@/lib/types';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconPlusCircle } from '@/components/ui/icons';
import { ModelMenu } from '@/components/model-menu';
import { SidebarToggle } from '@/components/sidebar-toggle';

interface ChatHeaderProps {
  chat?: Chat;
}

export function ChatHeader({ chat }: ChatHeaderProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-10 flex h-12 w-full shrink-0 items-center border-b bg-background duration-300 ease-in-out animate-in peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <SidebarToggle />
      <ModelMenu chat={chat} />
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'mr-2 size-9 lg:hidden'
        )}
      >
        <IconPlusCircle className="size-6" />
        <span className="sr-only">New Chat</span>
      </Link>
    </div>
  );
}
