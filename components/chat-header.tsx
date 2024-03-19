'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import { type Chat } from '@/lib/types'
import { ModelMenu } from '@/components/model-menu'
import { SidebarToggle } from '@/components/sidebar-toggle'
import { IconPlusCircle } from '@/components/ui/icons'
import { buttonVariants } from '@/components/ui/button'

interface ChatHeaderProps {
  chat?: Chat
}

export function ChatHeader({ chat }: ChatHeaderProps) {
  return (
    <div className="sticky overflow-hidden inset-x-0 top-0 z-10 flex items-center w-full h-12 px-2 shrink-0 border-b bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <SidebarToggle />
      <ModelMenu chat={chat} />
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-9 lg:hidden'
        )}
      >
        <IconPlusCircle className="size-6" />
        <span className="sr-only">New Chat</span>
      </Link>
    </div>
  )
}
