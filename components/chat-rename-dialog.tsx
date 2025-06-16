'use client';

import * as React from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { Chat } from '@/types';
import { updateChat } from '@/hooks/use-chats';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ChatRenameDialogProps {
  chat: Pick<Chat, 'id' | 'title'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatRenameDialog({
  chat,
  open,
  onOpenChange
}: ChatRenameDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState(chat.title);

  React.useEffect(() => {
    setTitle(chat.title);
  }, [chat.title]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        <DialogFooter>
          <Button
            disabled={isPending || !title || title === chat.title}
            onClick={() => {
              startTransition(async () => {
                if (!title) {
                  toast.error('Chat title is required');
                  return;
                }

                try {
                  await updateChat({ id: chat.id, title });
                  toast.success('Chat title saved', { duration: 2000 });
                  onOpenChange(false);
                } catch (err: any) {
                  toast.error(err.message);
                }
              });
            }}
          >
            {isPending ? (
              <>
                <CircleNotch className="animate-spin" />
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
