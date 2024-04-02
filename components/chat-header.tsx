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
    <div className="fixed inset-x-0 top-0 z-10 flex items-center w-full h-12 shrink-0 border-b bg-background animate-in duration-300 ease-in-out peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <SidebarToggle />
      <ModelMenu chat={chat} />
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-9 mr-2 lg:hidden'
        )}
      >
        <IconPlusCircle className="size-6" />
        <span className="sr-only">New Chat</span>
      </Link>
    </div>
  )
}
