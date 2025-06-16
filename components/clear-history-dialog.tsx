'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { useChatId } from '@/hooks/use-chat-id';
import { clearChats } from '@/hooks/use-chats';
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

interface ClearHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClearHistoryDialog({
  open,
  onOpenChange
}: ClearHistoryDialogProps) {
  const router = useRouter();
  const chatId = useChatId();
  const [isPending, startTransition] = React.useTransition();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your chat history and remove your data
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
                  await clearChats();
                  toast.success('All chat deleted', { duration: 2000 });
                  chatId && router.push('/');
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
