'use client'

import { cn } from '@/lib/utils'
import { useAtBottom } from '@/lib/hooks/use-at-bottom'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconArrowDown } from '@/components/ui/icons'

export function ButtonScrollToBottom({ className, ...props }: ButtonProps) {
  const { isAtBottom, scrollToBottom } = useAtBottom()

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        'absolute right-4 top-3 z-10 bg-background transition-opacity duration-300 sm:right-8',
        isAtBottom ? 'opacity-0' : 'opacity-100',
        className
      )}
      onClick={scrollToBottom}
      {...props}
    >
      <IconArrowDown />
      <span className="sr-only">Scroll to bottom</span>
    </Button>
  )
}
