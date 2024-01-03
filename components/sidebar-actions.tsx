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
import { ChatDeleteDialog } from './chat-delete-dialog'
import { ChatTitleDialog } from './chat-title-dialog'
import { updateChat } from '@/app/actions'

interface SidebarActionsProps {
  chat: Chat
  removeChat: (args: { id: string; path: string }) => ServerActionResult<void>
  shareChat: (id: string) => ServerActionResult<Chat>
}

export function SidebarActions({
  chat,
  removeChat,
  shareChat
}: SidebarActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-background data-[state=open]:bg-background outline-none"
          >
            <IconDotsThreeVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start">
          <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
            <IconShare className="mr-2" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <IconEdit className="mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
            <IconTrash className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChatShareDialog
        chat={chat}
        shareChat={shareChat}
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
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={() => setEditDialogOpen(false)}
      />
    </>
  )
}
