'use client'

import * as React from 'react'

import { useSidebar } from '@/lib/hooks/use-sidebar'
import { Button } from '@/components/ui/button'
import { IconSidebar } from '@/components/ui/icons'
import { Tooltip } from '@/components/ui/tooltip'

export function SidebarToggle() {
  const { isSidebarOpen, toggleSidebar } = useSidebar()

  return (
    <Tooltip content={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}>
      <Button
        variant="ghost"
        size="icon"
        className="size-9"
        onClick={toggleSidebar}
      >
        <IconSidebar className="size-6" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    </Tooltip>
  )
}
