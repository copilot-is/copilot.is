'use client';

import * as React from 'react';
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

import { api } from '@/lib/api';
import { Message } from '@/lib/types';
import {
  apiFromModel,
  cn,
  getMessageContentText,
  getProviderConfig,
  providerFromModel
} from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useSettings } from '@/hooks/use-settings';
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
  const { apiCustomEnabled, tts, apiConfigs } = useSettings();
  const { updateChatMessage, removeChatMessage } = useStore();
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 3000 });
  const [content, setContent] = React.useState('');
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isEditPending, startEditTransition] = React.useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (!Array.isArray(message.content)) {
      setContent(message.content);
    }
  }, [message.content]);

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(getMessageContentText(message.content));
  };

  const onRead = async () => {
    if (tts.enabled && tts.model && tts.voice) {
      const provider = providerFromModel(tts.model);
      const customProvider =
        apiCustomEnabled && provider
          ? apiConfigs?.[provider]?.provider
          : undefined;
      const config = getProviderConfig(
        apiCustomEnabled,
        provider,
        customProvider,
        apiConfigs
      );
      const usage = { model: tts.model };
      const input = getMessageContentText(message.content);

      setIsLoadingAudio(true);
      const result = await api.createAudio(
        apiFromModel(tts.model, customProvider),
        tts.voice,
        input,
        usage,
        config
      );
      setIsLoadingAudio(false);

      if (result && 'error' in result) {
        toast.error(result.error);
        return;
      }

      const audio = new Audio(result.audio);
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
      };
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
        'ml-11 inline-flex space-x-1 lg:group-focus-within:visible lg:group-hover:visible',
        message.role === 'assistant' ? 'mt-1' : '',
        isLastMessage ? 'lg:visible' : 'lg:invisible'
      )}
    >
      {tts.enabled && tts.model && tts.voice && (
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
      {!readonly && (
        <>
          {isLastMessage && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              onClick={reload}
              disabled={isLoading}
            >
              <ArrowsClockwise className="size-4" />
              <span className="sr-only">Retry</span>
            </Button>
          )}
          {message.role === 'user' && !Array.isArray(message.content) && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              disabled={isLoading || isEditPending}
              onClick={() => setEditDialogOpen(true)}
            >
              <PencilSimple className="size-4" />
              <span className="sr-only">Edit</span>
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
                defaultValue={content}
                onChange={e => setContent(e.target.value)}
                required
              />
              <DialogFooter>
                <Button
                  disabled={isEditPending}
                  onClick={() => {
                    startEditTransition(async () => {
                      if (!content) {
                        toast.error('Message content is required');
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
            size="icon"
            className="size-7 text-muted-foreground"
            disabled={isLoading || isDeletePending}
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
