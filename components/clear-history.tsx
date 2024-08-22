'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

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
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { IconSpinner, IconTrash } from '@/components/ui/icons';
import { Tooltip } from '@/components/ui/tooltip';

export function ClearHistory() {
  const router = useRouter();
  const params = useParams();
  const { chats, clearChats } = useStore();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Tooltip content="Clear history">
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-background"
            disabled={!Object.values(chats).length || isPending}
          >
            {isPending ? (
              <IconSpinner className="size-5" />
            ) : (
              <IconTrash className="size-5" />
            )}
          </Button>
        </AlertDialogTrigger>
      </Tooltip>
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
          <AlertDialogAction>
            <Button
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await api.clearChats();
                  toast.success('All chat deleted');
                  params.chatId && router.push('/');
                  setOpen(false);
                  clearChats();
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
