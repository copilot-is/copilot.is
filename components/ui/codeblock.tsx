import { memo, useMemo } from 'react';
import { Check, Copy } from '@phosphor-icons/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock = memo(({ language, value }: CodeBlockProps) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(value);
  };

  const syntaxHighlighter = useMemo(
    () => (
      <SyntaxHighlighter
        language={language}
        style={coldarkDark}
        PreTag="div"
        customStyle={{
          margin: 0,
          width: '100%'
        }}
        codeTagProps={{
          style: {
            fontSize: '0.875rem',
            fontFamily: 'var(--font-geist-mono)'
          }
        }}
      >
        {value}
      </SyntaxHighlighter>
    ),
    [language, value]
  );

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center justify-between px-3 py-px pr-1">
        <span className="text-xs lowercase">{language}</span>
        <div className="flex items-center">
          <Button
            variant="link"
            size="icon"
            className="text-zinc-100 hover:text-zinc-300"
            onClick={onCopy}
          >
            {isCopied ? <Check /> : <Copy />}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      </div>
      {syntaxHighlighter}
    </div>
  );
});
CodeBlock.displayName = 'CodeBlock';

export { CodeBlock };
