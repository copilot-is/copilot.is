'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';

export function NewChat() {
  const router = useRouter();

  return (
    <div className="flex p-3">
      <Button
        variant="outline"
        className="flex w-full items-center justify-start gap-0 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        onClick={() => {
          router.push('/');
          router.refresh();
        }}
      >
        <Plus className="-translate-x-2" weight="bold" />
        New Chat
      </Button>
    </div>
  );
}
