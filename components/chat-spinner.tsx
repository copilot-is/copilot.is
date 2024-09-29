'use client';

import React from 'react';
import { CircleNotch } from '@phosphor-icons/react';

import { ChatHeader } from '@/components/chat-header';

export function ChatSpinner() {
  return (
    <>
      <ChatHeader />
      <div className="flex w-full max-w-4xl flex-1 items-center justify-center p-4 pb-[4.5rem]">
        <CircleNotch className="size-8 animate-spin text-muted-foreground" />
      </div>
    </>
  );
}
