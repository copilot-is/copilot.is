'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
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

interface ClearHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClearHistoryDialog({
  open,
  onOpenChange
}: ClearHistoryDialogProps) {
  const router = useRouter();
  const params = useParams();
  const { clearChats } = useStore();
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
                const result = await api.clearChats();
                if (result && 'error' in result) {
                  toast.error(result.error);
                  return;
                }
                toast.success('All chat deleted', { duration: 2000 });
                params.chatId && router.push('/');
                clearChats();
                onOpenChange(false);
              });
            }}
          >
            {isPending ? (
              <>
                <CircleNotch className="mr-2 animate-spin" />
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
