'use client';

import * as React from 'react';
import {
  CheckCircle,
  CircleNotch,
  DotsThreeVertical,
  PencilSimple,
  ShareNetwork,
  Trash
} from '@phosphor-icons/react';
import { toast } from 'sonner';

import { Chat } from '@/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChatDeleteDialog } from '@/components/chat-delete-dialog';
import { ChatRenameDialog } from '@/components/chat-rename-dialog';

interface SidebarActionsProps {
  chat: Chat;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export function SidebarActions({
  chat,
  className,
  onOpenChange
}: SidebarActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const [titleDialogOpen, setTitleDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);

  const copyShareLink = async (chatId: string) => {
    if (isCopied || isSharing) return;

    try {
      setIsSharing(true);
      const result = await api.createShare(chatId);
      if (result && 'error' in result) {
        toast.error(result.error);
        return;
      }

      const sharedLink = new URL(window.location.origin);
      sharedLink.pathname = `/share/${result.id}`;
      await copyToClipboard(sharedLink.toString());
      toast.success('Share link copied to clipboard', { duration: 2000 });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-6 bg-background hover:bg-accent data-[state=open]:bg-accent dark:bg-accent dark:hover:bg-background dark:data-[state=open]:bg-background',
              className
            )}
          >
            <DotsThreeVertical weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start">
          <DropdownMenuItem
            onClick={() => copyShareLink(chat.id)}
            disabled={isCopied || isSharing}
          >
            {isCopied ? (
              <>
                <CheckCircle className="mr-2" /> Copied
              </>
            ) : isSharing ? (
              <>
                <CircleNotch className="mr-2 animate-spin" /> Sharing...
              </>
            ) : (
              <>
                <ShareNetwork className="mr-2" /> Share
              </>
            )}
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
