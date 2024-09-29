'use client';

import * as React from 'react';
import { Sidebar } from '@phosphor-icons/react';

import { useSidebar } from '@/hooks/use-sidebar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

export function SidebarToggle() {
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={toggleSidebar}
        >
          <Sidebar className="size-6" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">
        {isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
      </TooltipContent>
    </Tooltip>
  );
}
