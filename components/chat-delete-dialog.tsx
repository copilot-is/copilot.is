'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

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
  AlertDialogProps,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { IconSpinner } from '@/components/ui/icons';

interface ChatDeleteDialogProps extends AlertDialogProps {
  chat: Pick<Chat, 'id'>;
  onClose: () => void;
}

export function ChatDeleteDialog({
  chat,
  onClose,
  ...props
}: ChatDeleteDialogProps) {
  const router = useRouter();
  const parsms = useParams();
  const { removeChat } = useStore();
  const [isPending, startTransition] = React.useTransition();

  return (
    <AlertDialog {...props}>
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
          <AlertDialogAction>
            <Button
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await api.removeChat(chat.id);
                  toast.success('Chat deleted');
                  removeChat(chat.id);
                  parsms.chatId === chat.id && router.push('/');
                  onClose();
                });
              }}
            >
              {isPending ? (
                <>
                  <IconSpinner className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
