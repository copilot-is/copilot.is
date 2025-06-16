'use client';

import * as React from 'react';
import Link from 'next/link';

import { Chat } from '@/types';
import { cn, findModelByValue } from '@/lib/utils';
import { useChatId } from '@/hooks/use-chat-id';
import { ProviderIcon } from '@/components/provider-icon';

import { SidebarActions } from './sidebar-actions';

interface SidebarItemProps {
  chat: Chat;
}

export function SidebarItem({ chat }: SidebarItemProps) {
  const chatId = useChatId();
  const [isOpen, setIsOpen] = React.useState(false);

  const provider = findModelByValue(chat.model)?.provider;

  return (
    <div
      className={cn(
        'group relative flex h-9 items-center rounded-md p-2 hover:bg-background hover:shadow-sm dark:hover:bg-accent',
        {
          'bg-background shadow-sm dark:bg-accent': chat.id === chatId || isOpen
        }
      )}
    >
      <div className="flex size-6 items-center justify-center rounded-full border bg-background">
        <ProviderIcon provider={provider} />
      </div>
      <Link
        href={`/chat/${chat.id}`}
        className={cn(
          'w-full flex-1 items-center justify-start truncate p-1.5 text-sm',
          { 'font-medium': chat.id === chatId }
        )}
      >
        {chat.title}
      </Link>
      <SidebarActions
        className={cn(
          'absolute right-2 z-10 group-hover:opacity-100',
          chat.id === chatId || isOpen ? 'opacity-100' : 'opacity-0'
        )}
        chat={chat}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}
