'use client';

import * as React from 'react';
import { toast } from 'react-hot-toast';

import { api } from '@/lib/api';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { type Chat } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogProps,
  DialogTitle
} from '@/components/ui/dialog';
import { IconSpinner } from '@/components/ui/icons';

interface ChatShareDialogProps extends DialogProps {
  chat?: Pick<Chat, 'id' | 'title' | 'sharing'>;
  onClose: () => void;
}

export function ChatShareDialog({
  chat,
  onClose,
  ...props
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
      toast.success('Share link copied to clipboard', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
          fontSize: '14px'
        },
        iconTheme: {
          primary: 'white',
          secondary: 'black'
        }
      });
      onClose();
    },
    [copyToClipboard, onClose]
  );

  if (!chat) {
    return null;
  }

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share link to chat</DialogTitle>
          <DialogDescription>
            Anyone with the URL will be able to view the sharing chat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 rounded-md border p-4 text-sm">
          <div className="font-medium">{chat.title}</div>
        </div>
        <DialogFooter className="items-center">
          {chat.sharing && (
            <Button
              variant="link"
              disabled={isDeletePending}
              onClick={() => {
                startDeleteTransition(async () => {
                  await api.updateChat(chat.id, { sharing: false });
                  toast.success('Shared link deleted success');
                  updateChat(chat.id, { sharing: false });
                  onClose();
                });
              }}
            >
              {isDeletePending ? (
                <>
                  <IconSpinner className="mr-2 animate-spin" />
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
                if (!chat.sharing) {
                  await api.updateChat(chat.id, { sharing: true });
                  updateChat(chat.id, { sharing: true });
                }

                copyShareLink(sharePath);
              });
            }}
          >
            {isSharePending ? (
              <>
                <IconSpinner className="mr-2 animate-spin" />
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
