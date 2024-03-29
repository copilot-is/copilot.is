import toast from 'react-hot-toast'

import { Message, ModelProvider, type Usage } from '@/lib/types'

const createChat = async (
  provider: ModelProvider,
  data: { messages: Message[]; usage: Usage }
) => {
  const res = await fetch(`/api/chat/${provider}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  })

  if (!res.ok) {
    const json = await res.json()
    if (json.message) {
      toast.error(json.message)
    } else {
      toast.error('An unexpected error occurred')
    }
  }

  return await res.json()
}

export const api = {
  createChat
}
