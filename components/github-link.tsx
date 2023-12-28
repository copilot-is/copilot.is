import * as React from 'react'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { IconGitHub } from '@/components/ui/icons'
import { Tooltip } from '@/components/ui/tooltip'

export function GithubLink() {
  return (
    <Tooltip content="GitHub">
      <a
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'hover:bg-background'
        )}
        href="https://github.com/copilot-is/copilot.is"
        target="_blank"
      >
        <IconGitHub className="h-5 w-5" />
      </a>
    </Tooltip>
  )
}
