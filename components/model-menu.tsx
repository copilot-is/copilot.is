'use client'

import * as React from 'react'
import { toast } from 'react-hot-toast'

import { ServerActionResult, type Chat, Model } from '@/lib/types'
import { IconGoogleAI, IconOpenAI } from '@/components/ui/icons'
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

interface ModelMenuProps {
  chat?: Chat
  updateChat: (
    id: string,
    data: { [key: keyof Chat]: Chat[keyof Chat] }
  ) => ServerActionResult<Chat>
}

export function ModelMenu({ chat, updateChat }: ModelMenuProps) {
  const { availableModels, model, setModel, modelSettings } = useSettings()
  const [isPending, startTransition] = React.useTransition()
  const allowedModels = availableModels
    ? SupportedModels.filter(m => availableModels.includes(m.value))
    : SupportedModels
  const selectedModel = SupportedModels.find(
    m => m.value === (chat?.usage?.model || model)
  )

  const updateModel = async (value: Model) => {
    if (chat && value !== chat.usage.model) {
      const provider = SupportedModels.find(m => m.value === value)?.provider

      const usage = buildChatUsage({ ...modelSettings, model: value }, provider)

      const result = await updateChat(chat.id, { usage })

      if (result && 'error' in result) {
        toast.error(result.error)
      }
    } else {
      setModel(value)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger disabled={isPending} asChild>
          <Button variant="ghost" className="px-2">
            {selectedModel?.provider === 'openai' && <IconOpenAI />}
            {selectedModel?.provider === 'google' && <IconGoogleAI />}
            <span className="ml-2">{selectedModel?.text}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start">
          <DropdownMenuLabel>Model</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            className="overflow-auto max-h-64"
            value={selectedModel?.value}
            onValueChange={value => {
              startTransition(async () => {
                await updateModel(value)
              })
            }}
          >
            {allowedModels.map(model => (
              <DropdownMenuRadioItem key={model.value} value={model.value}>
                {model.text}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
