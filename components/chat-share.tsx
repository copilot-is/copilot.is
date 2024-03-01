'use client'

import { useState } from 'react'

import { type Chat, ServerActionResult } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { IconShare } from '@/components/ui/icons'
import { ChatShareDialog } from '@/components/chat-share-dialog'

interface ChatShareProps {
  chat?: Chat
  messages?: Chat['messages']
}

export function ChatShare({ chat, messages = [] }: ChatShareProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  if (!chat && !messages.length) {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        className="bg-background"
        onClick={() => setShareDialogOpen(true)}
      >
        <IconShare className="mr-2" />
        Share
      </Button>
      <ChatShareDialog
        chat={chat}
        messages={messages}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
    </>
  )
}
