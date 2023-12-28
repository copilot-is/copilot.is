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
  const { isSidebarOpen, toggleSidebar } = useSidebar()

  return (
    <>
      {isMobile && isSidebarOpen && (
        <div
          className="fixed z-20 left-0 top-0 w-full h-full bg-background/60 backdrop-blur-sm"
          onClick={toggleSidebar}
        ></div>
      )}
      <section
        data-state={isSidebarOpen ? 'open' : 'closed'}
        className={cn(
          'peer absolute flex-col h-full w-[280px] inset-y-0 z-30 -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px] dark:bg-zinc-950',
          isMobile ? 'flex' : 'hidden'
        )}
      >
        {children}
      </section>
    </>
  )
}
