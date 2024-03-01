'use client'

import { type Chat } from '@/lib/types'
import { ModelMenu } from '@/components/model-menu'
import { SidebarToggle } from '@/components/sidebar-toggle'

interface ChatHeaderProps {
  chat?: Chat
}

export function ChatHeader({ chat }: ChatHeaderProps) {
  return (
    <div className="sticky overflow-hidden inset-x-0 top-0 z-10 flex items-center w-full space-x-2 h-12 px-4 shrink-0 border-b bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <SidebarToggle />
      <ModelMenu chat={chat} />
    </div>
  )
}
