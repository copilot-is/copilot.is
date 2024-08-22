'use client';

import * as React from 'react';

import { type Chat } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  IconDotsThreeVertical,
  IconEdit,
  IconShare,
  IconTrash
} from '@/components/ui/icons';
import { ChatDeleteDialog } from '@/components/chat-delete-dialog';
import { ChatRenameDialog } from '@/components/chat-rename-dialog';
import { ChatShareDialog } from '@/components/chat-share-dialog';

interface SidebarActionsProps {
  chat: Chat;
}

export function SidebarActions({ chat }: SidebarActionsProps) {
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [titleDialogOpen, setTitleDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 outline-none hover:bg-background data-[state=open]:bg-background"
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
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
      <ChatDeleteDialog
        chat={chat}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      />
      <ChatRenameDialog
        chat={chat}
        open={titleDialogOpen}
        onOpenChange={setTitleDialogOpen}
        onClose={() => setTitleDialogOpen(false)}
      />
    </>
  );
}
