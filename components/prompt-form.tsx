import * as React from 'react'
import Link from 'next/link'
import { UseChatHelpers } from 'ai/react'
import Textarea from 'react-textarea-autosize'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { IconArrowElbow, IconPlus } from '@/components/ui/icons'
import { Tooltip } from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'

export interface PromptProps
  extends Pick<UseChatHelpers, 'input' | 'setInput'> {
  onSubmit: (value: string) => void
  isLoading: boolean
}

export function PromptForm({
  input,
  setInput,
  isLoading,
  onSubmit
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <form
      onSubmit={async e => {
        e.preventDefault()
        if (!input?.trim()) {
          return
        }
        setInput('')
        await onSubmit(input)
      }}
      ref={formRef}
    >
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-10 sm:rounded-md sm:border sm:px-14">
        <Tooltip content="New Chat" align="center" side="top">
          <Link
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon' }),
              'absolute left-0 top-4 rounded-full sm:left-4'
            )}
            href="/"
          >
            <IconPlus />
            <span className="sr-only">New Chat</span>
          </Link>
        </Tooltip>
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Send a message."
          spellCheck={false}
          className="min-h-[32px] w-full resize-none bg-transparent px-2 my-4 py-1.5 focus-within:outline-none sm:text-sm"
        />
        <div className="absolute right-0 top-4 sm:right-4">
          <Tooltip content="Send message" align="center" side="top">
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || input === ''}
            >
              <IconArrowElbow />
              <span className="sr-only">Send message</span>
            </Button>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
