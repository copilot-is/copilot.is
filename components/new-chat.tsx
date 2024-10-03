'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus } from '@phosphor-icons/react';

export function NewChat() {
  return (
    <div className="flex p-3">
      <Link
        href="/"
        className="flex w-full items-center rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Plus className="-translate-x-2" weight="bold" />
        New Chat
      </Link>
    </div>
  );
}
