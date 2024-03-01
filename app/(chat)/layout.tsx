import { appConfig } from '@/lib/appconfig'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { SettingsProvider } from '@/lib/hooks/use-settings'
import { Sidebar } from '@/components/sidebar'
import { SidebarPanel } from '@/components/sidebar-panel'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <SidebarProvider>
      <SettingsProvider
        defaultModel={appConfig.defaultModel}
        availableModels={appConfig.supportedModels}
        allowCustomAPIKey={appConfig.allowCustomAPIKey}
      >
        <div className="relative flex size-full bg-muted/50">
          <Sidebar>
            <SidebarPanel />
          </Sidebar>
          <main className="flex flex-col size-full pl-0 animate-in duration-300 ease-in-out overflow-auto peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
            {children}
          </main>
        </div>
      </SettingsProvider>
    </SidebarProvider>
  )
}
