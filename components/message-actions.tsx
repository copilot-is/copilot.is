'use client';

import * as React from 'react';
import { UseChatHelpers } from '@ai-sdk/react';
import {
  ArrowsClockwise,
  CheckCircle,
  CircleNotch,
  Copy,
  PauseCircle,
  PencilSimple,
  SpeakerHigh,
  Trash
} from '@phosphor-icons/react';
import { toast } from 'sonner';

import { ChatMessage } from '@/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useSettings } from '@/hooks/use-settings';
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

interface MessageActionsProps
  extends Partial<Pick<UseChatHelpers<ChatMessage>, 'status' | 'setMessages'>> {
  model: string;
  message: ChatMessage;
  reload?: () => void;
  isReadonly?: boolean;
  isLastMessage?: boolean;
}

export function MessageActions({
  model,
  status,
  reload,
  message,
  setMessages,
  isReadonly,
  isLastMessage
}: MessageActionsProps) {
  const { systemSettings, userSettings } = useSettings();
  const { speechEnabled } = systemSettings;
  const { speechModel, speechVoice } = userSettings;
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const [draftContent, setDraftContent] = React.useState('');
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isEditPending, startEditTransition] = React.useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const textFromParts = message.parts
    ?.filter(part => part.type === 'text')
    .map(part => part.text)
    .join('\n')
    .trim();

  React.useEffect(() => {
    setDraftContent(textFromParts);
  }, [textFromParts]);

  const onCopy = async () => {
    if (isCopied) return;

    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
  };

  const onRead = async () => {
    if (speechEnabled && speechModel && speechVoice) {
      setIsLoadingAudio(true);
      const result = await api.createSpeech(
        speechModel,
        speechVoice,
        textFromParts
      );
      setIsLoadingAudio(false);

      if (result && 'error' in result) {
        toast.error(result.error);
        setIsPlaying(false);
        return;
      }

      if (result.audio) {
        const audio = new Audio(result.audio);
        audioRef.current = audio;
        audio.volume = 1;
        audio.play();
        setIsPlaying(true);

        audio.onended = () => {
          setIsPlaying(false);
        };
      }
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.play();
      } else {
        onRead();
      }
      setIsPlaying(true);
    }
  };

  return (
    <div
      className={cn(
        'mt-2 flex items-center gap-1 lg:group-focus-within:visible lg:group-hover:visible',
        message.role === 'user' ? 'mr-12 justify-end' : 'ml-12',
        isLastMessage ? 'lg:visible' : 'lg:invisible'
      )}
    >
      {speechEnabled && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          onClick={togglePlayPause}
          disabled={isLoadingAudio}
        >
          {isLoadingAudio ? (
            <CircleNotch className="size-4 animate-spin" />
          ) : isPlaying ? (
            <PauseCircle className="size-4" />
          ) : (
            <SpeakerHigh className="size-4" />
          )}
          <span className="sr-only">
            {isLoadingAudio ? 'Loading...' : isPlaying ? 'Stop' : 'Play'}
          </span>
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground"
        onClick={onCopy}
        disabled={isCopied}
      >
        {isCopied ? (
          <CheckCircle className="size-4" />
        ) : (
          <Copy className="size-4" />
        )}
        <span className="sr-only">Copy</span>
      </Button>
      {!isReadonly && setMessages && reload && (
        <>
          {isLastMessage && (
            <Button
              variant="ghost"
              size="icon"
              className="group/retry h-7 w-auto gap-1 px-1.5 text-muted-foreground"
              onClick={() => reload()}
              disabled={status !== 'ready'}
            >
              <ArrowsClockwise className="size-4" />
              <span className="sr-only">Retry</span>
              <span className="hidden text-muted-foreground animate-out fade-out group-hover/retry:inline-block group-hover/retry:animate-in group-hover/retry:fade-in">
                {model}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            disabled={
              status === 'submitted' || status === 'streaming' || isEditPending
            }
            onClick={() => setEditDialogOpen(true)}
          >
            <PencilSimple className="size-4" />
            <span className="sr-only">Edit</span>
          </Button>
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
                defaultValue={draftContent}
                onChange={e => setDraftContent(e.target.value)}
                required
              />
              <DialogFooter>
                <Button
                  disabled={isEditPending || textFromParts === draftContent}
                  onClick={() => {
                    startEditTransition(async () => {
                      if (draftContent) {
                        const updated = {
                          ...message,
                          content: draftContent,
                          parts: message.parts.map(part =>
                            part.type === 'text'
                              ? { type: 'text' as const, text: draftContent }
                              : part
                          )
                        };

                        const result = await api.updateMessage(updated);
                        if (result && 'error' in result) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success('Message saved', { duration: 2000 });

                        setMessages((messages: any) => {
                          return messages.map((m: any) =>
                            m.id === message.id ? updated : m
                          );
                        });
                        setEditDialogOpen(false);

                        if (message.role === 'user') {
                          reload();
                        }
                      }
                    });
                  }}
                >
                  {isEditPending ? (
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
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            disabled={
              status === 'submitted' ||
              status === 'streaming' ||
              isDeletePending
            }
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash className="size-4" />
            <span className="sr-only">Delete</span>
          </Button>
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your{' '}
                  {message.role === 'user'
                    ? 'message and its assistant’s message'
                    : 'message'}
                  , remove your data from our servers.
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
                      const result = await api.removeMessage(message.id);
                      if (result && 'error' in result) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success('Message deleted', { duration: 2000 });
                      setMessages((messages: any) =>
                        messages.filter(
                          (m: any) =>
                            m.id !== message.id && m.parentId !== message.id
                        )
                      );
                      setDeleteDialogOpen(false);
                    });
                  }}
                >
                  {isDeletePending ? (
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
        </>
      )}
    </div>
  );
}
