import { useEffect } from 'react';
import Link from 'next/link';
import { useSystemSettings } from '@/contexts/system-settings-context';
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface ChatHeaderProps {
  title?: string;
}

export function ChatHeader({ title }: ChatHeaderProps) {
  const { appName } = useSystemSettings();

  useEffect(() => {
    const documentTitle = title ? `${title} - ${appName}` : appName;

    if (documentTitle !== document.title) {
      document.title = documentTitle;
    }
  }, [title, appName]);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center justify-center truncate px-1 font-semibold">
        {title}
      </div>
      <Button variant="ghost" size="icon" asChild className="size-9 lg:hidden">
        <Link href="/">
          <PlusCircle className="size-6" />
          <span className="sr-only">New Chat</span>
        </Link>
      </Button>
    </header>
  );
}
