import { UseChatHelpers } from 'ai/react'

import { IconOpenAI, IconGoogleAI, IconClaudeAI } from '@/components/ui/icons'

export interface EmptyScreenProps extends Pick<UseChatHelpers, 'setInput'> {
  provider: string
}

export function EmptyScreen({ provider, setInput }: EmptyScreenProps) {
  return (
    <div className="h-full mx-auto max-w-4xl px-4 flex flex-col items-center justify-center">
      <div className="flex items-center justify-center border rounded-full p-2 mb-4">
        {provider === 'openai' && <IconOpenAI className="size-8" />}
        {provider === 'google' && <IconGoogleAI className="size-8" />}
        {provider === 'anthropic' && <IconClaudeAI className="size-8" />}
      </div>
      <div className="mb-10 text-2xl font-medium">
        How can I help you today?
      </div>
    </div>
  )
}
