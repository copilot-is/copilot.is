'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { Chat } from '@/types';
import { deleteChat } from '@/hooks/use-chats';
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
  const params = useParams<{ id?: string }>();
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
                try {
                  await deleteChat(chat.id);
                  toast.success('Chat deleted', { duration: 2000 });
                  params.id === chat.id && router.push('/');
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
