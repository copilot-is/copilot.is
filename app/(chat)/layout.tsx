'use client';

import { SidebarProvider } from '@/hooks/use-sidebar';
import { Sidebar } from '@/components/sidebar';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex size-full">
        <Sidebar />
        <main className="flex size-full flex-col items-center overflow-hidden duration-300 ease-in-out peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
