'use client'

import * as React from 'react'
import { toast } from 'react-hot-toast'

import { Model, type Chat } from '@/lib/types'
import { IconClaudeAI, IconGoogleAI, IconOpenAI } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useSettings } from '@/lib/hooks/use-settings'
import { SupportedModels } from '@/lib/constant'
import { buildChatUsage } from '@/lib/utils'
import { updateChat } from '@/app/actions'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

interface ModelMenuProps {
  chat?: Pick<Chat, 'id' | 'usage'>
}

export function ModelMenu({ chat }: ModelMenuProps) {
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const { availableModels, model, setModel, modelSettings } = useSettings()
  const [isPending, startTransition] = React.useTransition()
  const allowedModels = availableModels
    ? SupportedModels.filter(m => availableModels.includes(m.value))
    : SupportedModels
  const selectedModel = SupportedModels.find(
    m => m.value === (chat?.usage?.model || model)
  )

  const updateModel = async (value: Model) => {
    if (chat && chat.usage.model !== value) {
      const usage = buildChatUsage({
        ...modelSettings,
        model: value,
        prompt: undefined
      })
      const result = await updateChat(chat.id, { usage })
      if (result && 'error' in result) {
        toast.error(result.error)
        return
      }
    } else {
      setModel(value)
    }
  }

  return (
    <div className="flex flex-1 px-1 items-center justify-center lg:justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger disabled={isPending} asChild>
          <Button variant="ghost" className="px-2 data-[state=open]:bg-accent">
            {selectedModel?.provider === 'openai' && <IconOpenAI />}
            {selectedModel?.provider === 'google' && <IconGoogleAI />}
            {selectedModel?.provider === 'anthropic' && <IconClaudeAI />}
            <span className="ml-2">{selectedModel?.text}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isMobile ? 'center' : 'start'}>
          <DropdownMenuLabel>Model</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            className="overflow-auto max-h-80"
            value={selectedModel?.value}
            onValueChange={value => {
              startTransition(async () => {
                await updateModel(value)
              })
            }}
          >
            {allowedModels.map(model => (
              <DropdownMenuRadioItem key={model.value} value={model.value}>
                {model.provider === 'openai' && <IconOpenAI />}
                {model.provider === 'google' && <IconGoogleAI />}
                {model.provider === 'anthropic' && <IconClaudeAI />}
                <span className="ml-2">{model.text}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
