'use client';

import * as React from 'react';
import {
  ArrowsClockwise,
  CheckCircle,
  CircleNotch,
  Copy,
  PencilSimple,
  Trash
} from '@phosphor-icons/react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ChatMessageActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  chatId: string;
  reload?: () => void;
  message: Message;
  isLoading?: boolean;
  isLastMessage?: boolean;
  readonly?: boolean;
}

export function ChatMessageActions({
  chatId,
  reload,
  message,
  isLoading,
  isLastMessage,
  readonly
}: ChatMessageActionsProps) {
  const { updateChatMessage, removeChatMessage } = useStore();
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 3000 });
  const [content, setContent] = React.useState(message.content);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isEditPending, startEditTransition] = React.useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeletePending, startDeleteTransition] = React.useTransition();

  React.useEffect(() => {
    setContent(message.content);
  }, [message.content]);

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(
      Array.isArray(content)
        ? content
            .map(c => {
              if (c.type === 'text') {
                return c.text;
              }
            })
            .join('\n\n')
        : content
    );
  };

  return (
    <div
      className={cn(
        'absolute bottom-2 right-2 flex items-center justify-end space-x-1 rounded-lg border bg-background p-1 sm:bottom-4 lg:group-hover:flex',
        isLastMessage ? 'lg:flex' : 'lg:hidden'
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-4 rounded-sm p-1 font-normal text-muted-foreground"
        onClick={onCopy}
        disabled={isCopied}
      >
        {isCopied ? <CheckCircle /> : <Copy />}
        <span className="ml-1 hidden sm:inline">Copy</span>
      </Button>
      {!readonly && (
        <>
          {isLastMessage && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 rounded-sm p-1 font-normal text-muted-foreground"
              onClick={reload}
              disabled={isLoading}
            >
              <ArrowsClockwise />
              <span className="ml-1 hidden sm:inline">Retry</span>
            </Button>
          )}
          {message.role === 'user' && !Array.isArray(content) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 rounded-sm p-1 font-normal text-muted-foreground"
              disabled={isLoading || isEditPending}
              onClick={() => setEditDialogOpen(true)}
            >
              <PencilSimple />
              <span className="ml-1 hidden sm:inline">Edit</span>
            </Button>
          )}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit message</DialogTitle>
                <DialogDescription>
                  Edit chat message content.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                className="min-h-32"
                defaultValue={!Array.isArray(content) ? content : ''}
                onChange={e => setContent(e.target.value)}
                required
              />
              <DialogFooter className="items-center">
                <Button
                  disabled={isEditPending}
                  onClick={() => {
                    startEditTransition(async () => {
                      if (!content) {
                        toast.error('Message is required');
                        return;
                      }

                      const updated = { ...message, content } as Message;
                      const result = await api.updateMessage(
                        chatId,
                        message.id,
                        updated
                      );
                      if (result && 'error' in result) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success('Message saved', { duration: 2000 });
                      updateChatMessage(chatId, updated);
                      setEditDialogOpen(false);
                    });
                  }}
                >
                  {isEditPending ? (
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
          <Button
            variant="ghost"
            size="sm"
            className="h-4 rounded-sm p-1 font-normal text-muted-foreground"
            disabled={isLoading || isDeletePending}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash />
            <span className="ml-1 hidden sm:inline">Delete</span>
          </Button>
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your message and remove your data
                  from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletePending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDeletePending}
                  onClick={e => {
                    e.preventDefault();
                    startDeleteTransition(async () => {
                      const result = await api.removeMessage(
                        chatId,
                        message.id
                      );
                      if (result && 'error' in result) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success('Message deleted', { duration: 2000 });
                      removeChatMessage(chatId, message.id);
                      setDeleteDialogOpen(false);
                    });
                  }}
                >
                  {isDeletePending ? (
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
        </>
      )}
    </div>
  );
}
