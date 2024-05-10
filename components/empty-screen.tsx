import { UseChatHelpers } from 'ai/react'

import { IconOpenAI, IconGoogleAI, IconClaudeAI } from '@/components/ui/icons'

export interface EmptyScreenProps extends Pick<UseChatHelpers, 'setInput'> {
  provider: string
}

export function EmptyScreen({ provider, setInput }: EmptyScreenProps) {
  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-4">
      <div className="mb-4 flex items-center justify-center rounded-full border">
        {provider === 'openai' && <IconOpenAI className="m-2.5 size-7" />}
        {provider === 'google' && <IconGoogleAI className="m-2.5 size-7" />}
        {provider === 'anthropic' && <IconClaudeAI className="m-2.5 size-7" />}
      </div>
      <div className="mb-10 text-lg font-medium lg:text-2xl">
        How can I help you today?
      </div>
    </div>
  )
}
