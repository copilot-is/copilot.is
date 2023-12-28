'use client'

import * as React from 'react'
import { type Model } from '@/lib/types'
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

interface ModelMenuProps {
  defaultModel?: Model
  updateModel: (model: Model) => Promise<void>
}

export function ModelMenu({ defaultModel, updateModel }: ModelMenuProps) {
  const { availableModels, model, setModel } = useSettings()
  const [isPending, startTransition] = React.useTransition()
  const allowedModels = availableModels
    ? SupportedModels.filter(m => availableModels.includes(m.value))
    : SupportedModels
  const selectedModel = allowedModels.find(
    m => m.value === (defaultModel || model)
  )

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
                if (defaultModel) {
                  await updateModel(value)
                } else {
                  setModel(value)
                }
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
