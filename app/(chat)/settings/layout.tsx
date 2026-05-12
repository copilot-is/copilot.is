import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SettingsNav } from '@/components/settings-nav';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex size-full flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4!"
        />
        <h1 className="truncate text-base font-semibold">Settings</h1>
      </header>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex flex-col gap-0 lg:flex-row">
          <SettingsNav />
          <div className="min-w-0 flex-1 pr-4 pl-8 md:pr-6 md:pl-12">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
