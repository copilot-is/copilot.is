'use client';

import * as React from 'react';
import { ChatsCircle, CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { type Chat } from '@/lib/types';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface ChatShareDialogProps {
  chat?: Pick<Chat, 'id' | 'title' | 'shared'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatShareDialog({
  chat,
  open,
  onOpenChange
}: ChatShareDialogProps) {
  const { updateChat } = useStore();
  const { copyToClipboard } = useCopyToClipboard({ timeout: 1000 });
  const [isSharePending, startShareTransition] = React.useTransition();
  const [isDeletePending, startDeleteTransition] = React.useTransition();

  const copyShareLink = React.useCallback(
    async (sharePath: string) => {
      const url = new URL(window.location.href);
      url.pathname = sharePath;
      copyToClipboard(url.toString());
      toast.success('Share link copied to clipboard', { duration: 2000 });
      onOpenChange(false);
    },
    [copyToClipboard, onOpenChange]
  );

  if (!chat) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share link to chat</DialogTitle>
          <DialogDescription>
            Anyone with the link will be able to view this shared chat.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 rounded-md border p-2 text-sm font-medium shadow-sm">
          <ChatsCircle className="size-4" />
          <div>{chat.title}</div>
        </div>
        <DialogFooter>
          {chat.shared && (
            <Button
              variant="link"
              disabled={isDeletePending}
              onClick={() => {
                startDeleteTransition(async () => {
                  const result = await api.updateChat(chat.id, {
                    shared: false
                  });
                  if (result && 'error' in result) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success('Shared link deleted success', {
                    duration: 2000
                  });
                  updateChat(chat.id, { shared: false });
                  onOpenChange(false);
                });
              }}
            >
              {isDeletePending ? (
                <>
                  <CircleNotch className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete this share link</>
              )}
            </Button>
          )}
          <Button
            disabled={isSharePending || isDeletePending}
            onClick={() => {
              startShareTransition(async () => {
                const sharePath = `/share/${chat.id}`;
                if (!chat.shared) {
                  const result = await api.updateChat(chat.id, {
                    shared: true
                  });
                  if (result && 'error' in result) {
                    toast.error(result.error);
                    return;
                  }
                  updateChat(chat.id, { shared: true });
                }

                copyShareLink(sharePath);
              });
            }}
          >
            {isSharePending ? (
              <>
                <CircleNotch className="mr-2 animate-spin" />
                Copying...
              </>
            ) : (
              <>Copy link</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
