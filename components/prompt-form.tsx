import * as React from 'react'
import { UseChatHelpers } from 'ai/react'
import Textarea from 'react-textarea-autosize'

import { Button } from '@/components/ui/button'
import { IconArrowElbow, IconPaperclip } from '@/components/ui/icons'
import { Tooltip } from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'

export interface PromptProps
  extends Pick<UseChatHelpers, 'input' | 'setInput'> {
  vision: boolean
  isLoading: boolean
  onSubmit: (value: string) => void
}

export function PromptForm({
  vision,
  input,
  setInput,
  isLoading,
  onSubmit
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit()
  const fileRef = React.useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileRef.current?.click()
  }

  return (
    <form
      ref={formRef}
      onSubmit={async e => {
        e.preventDefault()
        if (!input?.trim()) {
          return
        }
        setInput('')
        await onSubmit(input)
      }}
    >
      <div className="flex grow max-h-60 w-full items-start justify-between space-x-2 overflow-hidden bg-background py-4 sm:px-4 sm:rounded-md sm:border">
        {vision && (
          <Tooltip content="Upload docs or images" align="center" side="top">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md bg-accent/60"
              onClick={handleClick}
            >
              <input
                ref={fileRef}
                tabIndex={-1}
                className="hidden"
                type="file"
                multiple
              />
              <IconPaperclip className="size-5" />
              <span className="sr-only">Upload docs or images</span>
            </Button>
          </Tooltip>
        )}
        <Textarea
          autoFocus
          tabIndex={0}
          minRows={1}
          maxRows={8}
          value={input}
          onKeyDown={onKeyDown}
          onChange={e => setInput(e.target.value)}
          placeholder="Send a message."
          spellCheck={false}
          className="min-h-8 w-full flex-1 resize-none bg-transparent py-1.5 focus-within:outline-none sm:text-sm"
        />
        <Tooltip content="Send message" align="center" side="top">
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || input === ''}
          >
            <IconArrowElbow className="size-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </Tooltip>
      </div>
    </form>
  )
}
