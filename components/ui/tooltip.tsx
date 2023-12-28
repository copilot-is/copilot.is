'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@/lib/utils'

type TooltipElement = React.ElementRef<typeof TooltipPrimitive.Content>

type TooltipProps = React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Content
> & {
  content: string | React.ReactNode
}

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = React.forwardRef<TooltipElement, TooltipProps>(
  (
    {
      children,
      content,
      className,
      side = 'bottom',
      align = 'start',
      sideOffset = 4,
      ...props
    },
    ref
  ) => {
    return (
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            ref={ref}
            side={side}
            sideOffset={sideOffset}
            align={align}
            className={cn(
              'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md animate-in fade-in-50 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
              className
            )}
            {...props}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    )
  }
)

Tooltip.displayName = 'Tooltip'

export { Tooltip, TooltipProvider }
