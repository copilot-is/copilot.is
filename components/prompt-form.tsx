import * as React from 'react';
import { UseChatHelpers } from 'ai/react';
import Textarea from 'react-textarea-autosize';

import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import {
  MessageContent,
  type FileInfo,
  type MessageContentDetail
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { IconArrowElbow } from '@/components/ui/icons';
import { Tooltip } from '@/components/ui/tooltip';
import { Upload } from '@/components/upload';

export interface PromptProps
  extends Pick<UseChatHelpers, 'input' | 'setInput'> {
  vision: boolean;
  isLoading: boolean;
  onSubmit: (value: MessageContent) => void;
}

export function PromptForm({
  vision,
  input,
  setInput,
  isLoading,
  onSubmit
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const [files, setFiles] = React.useState<FileInfo[]>([]);

  return (
    <form
      ref={formRef}
      onSubmit={async e => {
        e.preventDefault();
        if (!input?.trim()) {
          return;
        }
        setInput('');
        setFiles([]);

        const content =
          vision && files.length > 0
            ? ([
                {
                  type: 'text',
                  text: input
                } as MessageContentDetail
              ].concat(
                files.map(
                  file =>
                    ({
                      type: 'image',
                      data: file.data
                    }) as MessageContentDetail
                )
              ) as MessageContent)
            : input;
        await onSubmit(content);
      }}
    >
      <div className="flex max-h-60 w-full grow items-start justify-between space-x-2 overflow-hidden bg-background py-4 sm:rounded-md sm:border sm:px-4">
        <Upload value={files} vision={vision} onChange={setFiles} />
        <Textarea
          autoFocus
          tabIndex={0}
          minRows={1}
          maxRows={8}
          value={input}
          onKeyDown={onKeyDown}
          onChange={e => setInput(e.target.value)}
          placeholder="Send a message."
          spellCheck={false}
          className="min-h-8 w-full flex-1 resize-none bg-transparent py-1.5 focus-within:outline-none sm:text-sm"
        />
        <Tooltip content="Send message" align="center" side="top">
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || input === ''}
          >
            <IconArrowElbow className="size-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </Tooltip>
      </div>
    </form>
  );
}
