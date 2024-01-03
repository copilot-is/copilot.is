'use client'

import { toast } from 'react-hot-toast'

import { ServerActionResult, type Chat, Usage, Model } from '@/lib/types'
import { SupportedModels } from '@/lib/constant'
import { buildGoogleGenAIUsage, buildOpenAIUsage } from '@/lib/utils'
import { ModelMenu } from '@/components/model-menu'
import { SidebarToggle } from '@/components/sidebar-toggle'
import { useSettings } from '@/lib/hooks/use-settings'

interface ChatHeaderProps {
  id?: string
  usage?: Usage
  updateChat?: (
    id: string,
    data: { [key: keyof Chat]: Chat[keyof Chat] }
  ) => ServerActionResult<Chat>
}

export function ChatHeader({ id, usage, updateChat }: ChatHeaderProps) {
  const { modelSettings } = useSettings()

  const updateModel = async (value: Model) => {
    if (updateChat && id && usage) {
      const usageProvider = SupportedModels.find(m => m.value === usage.model)
        ?.provider
      const selectedProvider = SupportedModels.find(m => m.value === value)
        ?.provider

      let newUsage: Usage

      if (selectedProvider !== usageProvider) {
        newUsage = { ...modelSettings, model: value }
      } else {
        newUsage = { ...usage, model: value }
      }

      if (selectedProvider === 'openai') {
        newUsage = buildOpenAIUsage(newUsage)
      } else if (selectedProvider === 'google') {
        newUsage = buildGoogleGenAIUsage(newUsage)
      }

      if (newUsage) {
        const result = await updateChat(id, {
          usage: newUsage
        })

        if (result && 'error' in result) {
          toast.error(result.error)
        }
      }
    }
  }

  return (
    <div className="sticky overflow-hidden inset-x-0 top-0 z-10 flex items-center w-full space-x-2 h-12 px-4 shrink-0 border-b bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <SidebarToggle />
      <ModelMenu defaultModel={usage?.model} updateModel={updateModel} />
    </div>
  )
}
