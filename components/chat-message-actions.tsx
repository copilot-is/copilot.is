'use client';

import * as React from 'react';
import { toast } from 'react-hot-toast';

import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { Message, type Chat } from '@/lib/types';
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
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconSpinner,
  IconTrash
} from '@/components/ui/icons';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip } from '@/components/ui/tooltip';
import { deleteMessage, updateMessage } from '@/app/actions';

interface ChatMessageActionsProps {
  chat: Pick<Chat, 'id' | 'messages'>;
  message: Message;
  setMessages?: (messages: Message[]) => void;
}

export function ChatMessageActions({
  chat,
  message,
  setMessages
}: ChatMessageActionsProps) {
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
    <div className="flex items-center justify-end lg:absolute lg:right-0 lg:top-0">
      <Tooltip content="Copy message">
        <Button variant="ghost" size="icon" onClick={onCopy}>
          {isCopied ? <IconCheck /> : <IconCopy />}
          <span className="sr-only">Copy message</span>
        </Button>
      </Tooltip>
      {setMessages && (
        <>
          <Tooltip content="Edit message">
            <Button
              variant="ghost"
              size="icon"
              disabled={isEditPending || Array.isArray(content)}
              onClick={() => setEditDialogOpen(true)}
            >
              <IconEdit />
            </Button>
          </Tooltip>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit message</DialogTitle>
                <DialogDescription>
                  Edit chat message content.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                className="min-h-64"
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

                      const result = await updateMessage(message.id, chat.id, {
                        ...message,
                        content
                      });

                      if (result && 'error' in result) {
                        toast.error(result.error);
                        return;
                      }

                      if (chat.messages) {
                        const messages = chat.messages.map(m =>
                          m.id === message.id
                            ? ({ ...m, content } as Message)
                            : m
                        );
                        setMessages(messages);
                      }

                      toast.success('Message saved');
                      setEditDialogOpen(false);
                    });
                  }}
                >
                  {isEditPending ? (
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
          <Tooltip content="Delete message">
            <Button
              variant="ghost"
              size="icon"
              disabled={
                isDeletePending ||
                Array.isArray(content) ||
                chat.messages?.length === 1
              }
              onClick={() => setDeleteDialogOpen(true)}
            >
              <IconTrash />
            </Button>
          </Tooltip>
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
                  onClick={event => {
                    event.preventDefault();
                    startDeleteTransition(async () => {
                      const result = await deleteMessage(message.id, chat.id);

                      if (result && 'error' in result) {
                        toast.error(result.error);
                        return;
                      }

                      if (chat.messages) {
                        const messages = chat.messages.filter(
                          m => m.id !== message.id
                        );
                        setMessages(messages);
                      }

                      toast.success('Message deleted');
                      setDeleteDialogOpen(false);
                    });
                  }}
                >
                  {isDeletePending && (
                    <IconSpinner className="mr-2 animate-spin" />
                  )}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
