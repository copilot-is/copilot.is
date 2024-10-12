'use client';

import * as React from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

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
  const { updateChat } = useStore();
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

                const result = await api.updateChat(chat.id, { title });
                if (result && 'error' in result) {
                  toast.error(result.error);
                  return;
                }
                toast.success('Chat title saved', { duration: 2000 });
                updateChat(chat.id, { title });
                onOpenChange(false);
              });
            }}
          >
            {isPending ? (
              <>
                <CircleNotch className="mr-2 animate-spin" />
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
