import { ArtifactProvider } from '@/contexts/artifact-context';
import { PreferencesProvider } from '@/contexts/preferences-context';
import { SystemSettingsProvider } from '@/contexts/system-settings-context';

import { api } from '@/trpc/server';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const settings = await api.settings.getSystem();

  return (
    <SystemSettingsProvider settings={settings}>
      <PreferencesProvider>
        <ArtifactProvider>
          <SidebarProvider className="h-svh overflow-hidden">
            <Sidebar />
            <SidebarInset className="h-full overflow-hidden">
              {children}
            </SidebarInset>
          </SidebarProvider>
        </ArtifactProvider>
      </PreferencesProvider>
    </SystemSettingsProvider>
  );
}
