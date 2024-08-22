'use client';

import * as React from 'react';
import { toast } from 'react-hot-toast';

import { api } from '@/lib/api';
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
import { Input } from '@/components/ui/input';

interface ChatRenameDialogProps extends DialogProps {
  chat: Pick<Chat, 'id' | 'title'>;
  onClose: () => void;
}

export function ChatRenameDialog({
  chat,
  onClose,
  ...props
}: ChatRenameDialogProps) {
  const { updateChat } = useStore();
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState(chat.title);

  React.useEffect(() => {
    setTitle(chat.title);
  }, [chat.title]);

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename title</DialogTitle>
          <DialogDescription>Give chat rename a new title.</DialogDescription>
        </DialogHeader>
        <Input
          defaultValue={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <DialogFooter className="items-center">
          <Button
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                if (!title) {
                  toast.error('Chat title is required');
                  return;
                }

                await api.updateChat(chat.id, { title });
                toast.success('Chat title saved');
                updateChat(chat.id, { title });
                onClose();
              });
            }}
          >
            {isPending ? (
              <>
                <IconSpinner className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
