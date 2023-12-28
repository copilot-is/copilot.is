import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { SettingsProvider } from '@/lib/hooks/use-settings'
import { Sidebar } from '@/components/sidebar'
import { ChatHistory } from '@/components/chat-history'

const defaultModel = process.env.DEFAULT_MODEL
const availableModels = process.env.SUPPORTED_MODELS
const allowCustomAPIKey =
  process.env.ALLOW_CUSTOM_API_KEY === 'false' ? false : undefined

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <SidebarProvider>
      <SettingsProvider
        defaultModel={defaultModel}
        availableModels={availableModels?.split(',')}
        allowCustomAPIKey={allowCustomAPIKey}
      >
        <div className="relative flex h-full w-full bg-muted/50">
          <Sidebar>
            <ChatHistory />
          </Sidebar>
          <main className="flex flex-col h-full w-full pl-0 animate-in duration-300 ease-in-out overflow-auto peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
            {children}
          </main>
        </div>
      </SettingsProvider>
    </SidebarProvider>
  )
}
