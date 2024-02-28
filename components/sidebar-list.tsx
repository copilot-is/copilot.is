import { Chat } from '@/lib/types'
import { SidebarItems } from '@/components/sidebar-items'

export interface SidebarListProps {
  chats?: Chat[]
}

export function SidebarList({ chats }: SidebarListProps) {
  return (
    <div className="flex-1 overflow-auto">
      {chats?.length ? (
        <div className="space-y-2 px-3">
          <SidebarItems chats={chats} />
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No chat history</p>
        </div>
      )}
    </div>
  )
}
