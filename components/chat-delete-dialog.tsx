'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { type Chat } from '@/lib/types';
import { useStore } from '@/store/useStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface ChatDeleteDialogProps {
  chat: Pick<Chat, 'id'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatDeleteDialog({
  chat,
  open,
  onOpenChange
}: ChatDeleteDialogProps) {
  const router = useRouter();
  const parsms = useParams();
  const { removeChat } = useStore();
  const [isPending, startTransition] = React.useTransition();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your chat message and remove your data
            from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={e => {
              e.preventDefault();
              startTransition(async () => {
                const result = await api.removeChat(chat.id);
                if (result && 'error' in result) {
                  toast.error(result.error);
                  return;
                }
                toast.success('Chat deleted', { duration: 2000 });
                removeChat(chat.id);
                parsms.chatId === chat.id && router.push('/');
                onOpenChange(false);
              });
            }}
          >
            {isPending ? (
              <>
                <CircleNotch className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>Delete</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
