'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/hooks/use-sidebar'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

export interface SidebarProps {
  children?: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const { isSidebarOpen, closeSidebar } = useSidebar()

  return (
    <>
      {isMobile && isSidebarOpen && (
        <div
          className="bg-background/60 fixed left-0 top-0 z-20 size-full backdrop-blur-sm"
          onClick={closeSidebar}
        ></div>
      )}
      <section
        data-state={isSidebarOpen ? 'open' : 'closed'}
        className={cn(
          'bg-muted peer absolute inset-y-0 z-30 h-full w-[280px] -translate-x-full flex-col border-r duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px] dark:bg-zinc-950',
          isMobile ? 'flex' : 'hidden'
        )}
      >
        {children}
      </section>
    </>
  )
}
