import * as React from 'react';
import {
  ArrowElbowDownLeft,
  CircleNotch,
  Paperclip,
  Stop,
  X
} from '@phosphor-icons/react';
import { ImagePart, TextPart, UserContent } from 'ai';
import { UseChatHelpers } from 'ai/react';
import Textarea from 'react-textarea-autosize';
import { toast } from 'sonner';

import { cn, readFileAsBase64 } from '@/lib/utils';
import { useEnterSubmit } from '@/hooks/use-enter-submit';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

export interface PromptProps
  extends Pick<UseChatHelpers, 'input' | 'setInput' | 'isLoading'> {
  stop?: () => void;
  isVision: boolean;
  onSubmit: (value: UserContent) => Promise<void>;
  className?: string;
  containerClassName?: string;
}

export function PromptForm({
  stop,
  input,
  setInput,
  isLoading,
  isVision,
  onSubmit,
  className,
  containerClassName
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const [files, setFiles] = React.useState<FileList | undefined>(undefined);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isUploadPending, startUploadTransition] = React.useTransition();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles || inputFiles.length === 0) return;

    let newFiles = Array.from(inputFiles);
    let existingFiles = files ? Array.from(files) : [];

    if (existingFiles.length + newFiles.length > 5) {
      toast.error(
        'Maximum 5 files allowed in total. Some files may be skipped.'
      );
      newFiles = newFiles.slice(0, Math.max(5 - existingFiles.length, 0));
    }

    newFiles = newFiles.filter(newFile => {
      if (!newFile.type.startsWith('image/')) {
        toast.error(
          `File "${newFile.name}" is not an image and will be skipped.`
        );
        return false;
      }

      const isExisting = existingFiles.some(
        existingFile =>
          existingFile.name === newFile.name &&
          existingFile.size === newFile.size
      );
      if (isExisting) {
        toast.error(
          `File "${newFile.name}" is already uploaded and will be skipped.`
        );
        return false;
      }

      if (newFile.size > 5 * 1024 * 1024) {
        toast.error(
          `File "${newFile.name}" exceeds 5mb limit and will be skipped.`
        );
        return false;
      }

      return true;
    });

    const dataTransfer = new DataTransfer();
    [...existingFiles, ...newFiles].forEach(file =>
      dataTransfer.items.add(file)
    );
    setFiles(dataTransfer.files.length > 0 ? dataTransfer.files : undefined);
  };

  const removeFile = (index: number) => {
    if (files) {
      const dataTransfer = new DataTransfer();
      Array.from(files).forEach((file, i) => {
        if (i !== index) {
          dataTransfer.items.add(file);
        }
      });
      setFiles(dataTransfer.files.length > 0 ? dataTransfer.files : undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    let content: UserContent = trimmedInput;

    if (isVision && files && files.length > 0) {
      content = [{ type: 'text', text: trimmedInput }];
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        const image = await readFileAsBase64(file);
        (content as (TextPart | ImagePart)[]).push({
          type: 'image',
          image,
          mimeType: file.type
        });
      }
    }

    setInput('');
    setFiles(undefined);
    await onSubmit(content);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn('w-full max-w-4xl flex-col px-2', className)}
    >
      {isVision && files && (
        <div className="mx-3 flex space-x-2 rounded-t-xl border border-b-0 bg-accent p-3 shadow-md">
          {Array.from(files).map((file, index) => (
            <div key={index} className="relative">
              <div className="h-16 w-24 cursor-pointer overflow-hidden rounded-md border p-px">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="size-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={isLoading || isUploadPending}
                className="absolute -right-2 -top-2 size-5 rounded-full border bg-accent p-0 hover:bg-red-700 hover:text-white"
                onClick={() => removeFile(index)}
              >
                <X className="size-3" />
                <span className="sr-only">Delete file</span>
              </Button>
            </div>
          ))}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-t-xl border border-b-0 bg-background p-3 shadow-md sm:p-4',
          containerClassName
        )}
      >
        <div className="relative flex max-h-96 w-full items-start space-x-2 overflow-hidden">
          {isVision && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  disabled={isUploadPending}
                  onClick={() => {
                    fileRef.current?.click();
                  }}
                >
                  {isUploadPending ? (
                    <CircleNotch className="animate-spin" />
                  ) : (
                    <>
                      <input
                        multiple
                        disabled={isLoading || isUploadPending}
                        ref={fileRef}
                        tabIndex={-1}
                        className="hidden"
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.webp"
                        onChange={e =>
                          startUploadTransition(() => handleFileInputChange(e))
                        }
                      />
                      <Paperclip className="size-4" />
                    </>
                  )}
                  <span className="sr-only">Upload attachments</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload attachments (Max 5, 5mb)</TooltipContent>
            </Tooltip>
          )}
          <Textarea
            autoFocus
            ref={textareaRef}
            tabIndex={0}
            disabled={isLoading || isUploadPending}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                const textarea = e.currentTarget;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;
                textarea.value =
                  value.substring(0, start) + '\n' + value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 1;
                setInput(textarea.value);
              } else {
                onKeyDown(e);
              }
            }}
            rows={1}
            minRows={1}
            maxRows={8}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Send a message."
            spellCheck={false}
            className="min-h-8 flex-1 resize-none bg-transparent py-2 focus-within:outline-none"
          />
          {isLoading && stop ? (
            <Button
              type="button"
              size="icon"
              className="rounded-full"
              onClick={stop}
            >
              <Stop weight="fill" className="size-4" />
              <span className="sr-only">Stop generating</span>
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className="rounded-full"
              disabled={input?.trim() === ''}
            >
              {isLoading ? (
                <CircleNotch className="size-4 animate-spin" />
              ) : (
                <ArrowElbowDownLeft className="size-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          )}
        </div>
        <div className="mt-3 text-right text-xs italic text-muted-foreground">
          Use shift+enter for new line
        </div>
      </div>
    </form>
  );
}
