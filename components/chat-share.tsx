'use client'

import { useState } from 'react'

import { type Chat, ServerActionResult } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { IconShare } from '@/components/ui/icons'
import { ChatShareDialog } from './chat-share-dialog'

interface ChatShareProps {
  chat: Pick<Chat, 'id' | 'title' | 'messages'>
  shareChat: (id: string) => ServerActionResult<Chat>
}

export function ChatShare({ chat, shareChat }: ChatShareProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

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
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        onCopy={() => setShareDialogOpen(false)}
        shareChat={shareChat}
        chat={chat}
      />
    </>
  )
}
