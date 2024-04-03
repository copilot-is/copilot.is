import { appConfig } from '@/lib/appconfig'
import { getSupportedModels } from '@/lib/utils'
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
        availableModels={getSupportedModels(
          appConfig.openai.models,
          appConfig.google.models,
          appConfig.anthropic.models
        )}
        allowCustomAPIKey={appConfig.allowCustomAPIKey}
      >
        <div className="bg-muted/50 relative flex size-full">
          <Sidebar>
            <SidebarPanel />
          </Sidebar>
          {children}
        </div>
      </SettingsProvider>
    </SidebarProvider>
  )
}
