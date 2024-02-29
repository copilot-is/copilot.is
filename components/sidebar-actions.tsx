'use client'

import * as React from 'react'

import { type Chat, ServerActionResult } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  IconDotsThreeVertical,
  IconEdit,
  IconShare,
  IconTrash
} from '@/components/ui/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ChatShareDialog } from '@/components/chat-share-dialog'
import { ChatDeleteDialog } from '@/components/chat-delete-dialog'
import { ChatTitleDialog } from '@/components/chat-title-dialog'

interface SidebarActionsProps {
  chat: Chat
  removeChat: (id: string) => ServerActionResult<void>
  updateChat: (
    id: string,
    data: { [key: keyof Chat]: Chat[keyof Chat] }
  ) => ServerActionResult<Chat>
}

export function SidebarActions({
  chat,
  removeChat,
  updateChat
}: SidebarActionsProps) {
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [titleDialogOpen, setTitleDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 hover:bg-background data-[state=open]:bg-background outline-none"
          >
            <IconDotsThreeVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start">
          <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
            <IconShare className="mr-2" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTitleDialogOpen(true)}>
            <IconEdit className="mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
            <IconTrash className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChatShareDialog
        chat={chat}
        updateChat={updateChat}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        onCopy={() => setShareDialogOpen(false)}
      />
      <ChatDeleteDialog
        chat={chat}
        removeChat={removeChat}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={() => setDeleteDialogOpen(false)}
      />
      <ChatTitleDialog
        chat={chat}
        updateChat={updateChat}
        open={titleDialogOpen}
        onOpenChange={setTitleDialogOpen}
        onUpdate={() => setTitleDialogOpen(false)}
      />
    </>
  )
}
