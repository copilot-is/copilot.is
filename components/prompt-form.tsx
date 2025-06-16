import { useRef, useState } from 'react';
import { UseChatHelpers } from '@ai-sdk/react';
import { Attachment } from '@ai-sdk/ui-utils';
import { ArrowUp, CircleNotch, Lightbulb, Stop } from '@phosphor-icons/react';
import Textarea from 'react-textarea-autosize';

import { cn, findModelByValue } from '@/lib/utils';
import { useEnterSubmit } from '@/hooks/use-enter-submit';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { AttachmentsButton } from '@/components/attachments-button';
import { AttachmentsPreview } from '@/components/attachments-preview';
import { ModelMenu } from '@/components/model-menu';

export interface PromptFormProps
  extends Pick<UseChatHelpers, 'status' | 'stop' | 'input' | 'setInput'> {
  model: string;
  setModel: (value: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    attachments?: Attachment[]
  ) => void;
}

export function PromptForm({
  model,
  setModel,
  status,
  stop,
  input,
  setInput,
  onInputChange,
  onSubmit
}: PromptFormProps) {
  const { chatPreferences, setChatPreferences } = useSettings();
  const { isReasoning } = chatPreferences;
  const { formRef, onKeyDown } = useEnterSubmit();
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectedModel = findModelByValue(model);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e, attachments);
    setInput('');
    setAttachments([]);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full">
      {selectedModel?.vision && (
        <AttachmentsPreview
          disabled={status === 'submitted' || status === 'streaming'}
          uploadQueue={uploadQueue}
          attachments={attachments}
          setAttachments={setAttachments}
        />
      )}
      <div className="w-full rounded-2xl border bg-background p-4 shadow-md">
        <div className="relative flex w-full items-start space-x-2">
          <Textarea
            autoFocus
            required
            ref={textareaRef}
            tabIndex={0}
            spellCheck={false}
            placeholder="Send a message."
            className="flex-1 resize-none bg-transparent p-1 focus-within:outline-none"
            rows={1}
            minRows={1}
            maxRows={8}
            disabled={status === 'submitted' || status === 'streaming'}
            value={input}
            onChange={onInputChange}
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
              } else if (e.key === 'Enter') {
                if (!input.trim()) {
                  e.preventDefault();
                  return;
                }
                onKeyDown(e);
              } else {
                onKeyDown(e);
              }
            }}
          />
        </div>
        <div className="mt-5 flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <ModelMenu model={model} setModel={setModel} status={status} />
            {selectedModel?.reasoning && (
              <Button
                type="button"
                variant="outline"
                disabled={status === 'submitted' || status === 'streaming'}
                className={cn('h-9 rounded-full px-3 shadow-none', {
                  'border-muted-foreground/30 bg-muted': isReasoning
                })}
                onClick={async () => {
                  setChatPreferences('isReasoning', !isReasoning);
                }}
              >
                <Lightbulb
                  weight={isReasoning ? 'regular' : 'duotone'}
                  className={
                    isReasoning
                      ? 'fill-muted-foreground'
                      : 'fill-muted-foreground/30'
                  }
                />
                Think
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {selectedModel?.vision && (
              <AttachmentsButton
                disabled={status === 'submitted' || status === 'streaming'}
                uploadQueue={uploadQueue}
                setUploadQueue={setUploadQueue}
                attachments={attachments}
                setAttachments={setAttachments}
              />
            )}
            {status === 'streaming' ? (
              <Button
                type="button"
                size="icon"
                className="size-9 rounded-full shadow-none"
                onClick={stop}
              >
                <Stop weight="fill" className="size-4" />
                <span className="sr-only">Stop generating</span>
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="size-9 rounded-full shadow-none"
                disabled={
                  input?.trim() === '' ||
                  status === 'submitted' ||
                  uploadQueue.length > 0
                }
              >
                {status === 'submitted' ? (
                  <CircleNotch className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
