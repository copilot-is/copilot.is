import { useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle } from '@phosphor-icons/react';

import { env } from '@/lib/env';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { SidebarToggle } from '@/components/sidebar-toggle';

const PRODUCT_NAME = env.NEXT_PUBLIC_PRODUCT_NAME;

interface ChatHeaderProps {
  title?: string;
}

export function ChatHeader({ title }: ChatHeaderProps) {
  useEffect(() => {
    const documentTitle = title
      ? `${title} - ${PRODUCT_NAME}`
      : PRODUCT_NAME;

    if (documentTitle !== document.title) {
      document.title = documentTitle;
    }
  }, [title]);
  
  return (
    <div className="sticky top-0 z-10 flex w-full items-center bg-background p-3">
      <SidebarToggle />
      <div className="flex flex-1 items-center justify-center truncate px-1 font-semibold">
        {title}
      </div>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-9 lg:opacity-0 [&_svg]:size-6'
        )}
      >
        <PlusCircle />
        <span className="sr-only">New Chat</span>
      </Link>
    </div>
  );
}
