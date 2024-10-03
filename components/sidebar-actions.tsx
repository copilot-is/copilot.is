'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  DotsThreeVertical,
  PencilSimple,
  ShareNetwork,
  Trash
} from '@phosphor-icons/react';

import { type Chat } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChatDeleteDialog } from '@/components/chat-delete-dialog';
import { ChatRenameDialog } from '@/components/chat-rename-dialog';
import { ChatShareDialog } from '@/components/chat-share-dialog';

interface SidebarActionsProps {
  chat: Chat;
}

export function SidebarActions({ chat }: SidebarActionsProps) {
  const { chatId } = useParams();
  const isActive = chatId === chat.id;
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
            className={cn(
              'size-6 hover:bg-background data-[state=open]:bg-background dark:hover:bg-accent dark:data-[state=open]:bg-accent',
              isActive
                ? 'hover:bg-accent data-[state=open]:bg-accent dark:hover:bg-background dark:data-[state=open]:bg-background'
                : ''
            )}
          >
            <DotsThreeVertical weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start">
          <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
            <ShareNetwork className="mr-2" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTitleDialogOpen(true)}>
            <PencilSimple className="mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
            <Trash className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChatShareDialog
        chat={chat}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
      <ChatDeleteDialog
        chat={chat}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      <ChatRenameDialog
        chat={chat}
        open={titleDialogOpen}
        onOpenChange={setTitleDialogOpen}
      />
    </>
  );
}
