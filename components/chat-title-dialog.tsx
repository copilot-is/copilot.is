'use client';

import * as React from 'react';
import { toast } from 'react-hot-toast';

import { type Chat } from '@/lib/types';
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
import { updateChat } from '@/app/actions';

interface ChatTitleDialogProps extends DialogProps {
  chat: Pick<Chat, 'id' | 'title'>;
  onClose: () => void;
}

export function ChatTitleDialog({
  chat,
  onClose,
  ...props
}: ChatTitleDialogProps) {
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

                const result = await updateChat(chat.id, { title });

                if (result && 'error' in result) {
                  toast.error(result.error);
                  return;
                }

                toast.success('Chat title saved');
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
