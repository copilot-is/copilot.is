import { memo, useMemo } from 'react';
import { Check, Copy } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight
} from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock = memo(({ language, value }: CodeBlockProps) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
  const { theme = 'system', systemTheme } = useTheme();

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(value);
  };

  const syntaxHighlighter = useMemo(
    () => (
      <SyntaxHighlighter
        PreTag="div"
        language={language}
        style={
          theme === 'system'
            ? systemTheme === 'dark'
              ? oneDark
              : oneLight
            : theme === 'dark'
              ? oneDark
              : oneLight
        }
        customStyle={{
          margin: 0,
          width: '100%',
          borderRadius: 'calc(var(--radius) - 2px)'
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
    [value, language, theme, systemTheme]
  );

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center justify-between bg-[#FAFAFA] pl-3 pr-px dark:bg-[#282C34]">
        <span className="text-xs lowercase text-muted-foreground">
          {language}
        </span>
        <div className="flex items-center">
          <Button
            variant="link"
            size="icon"
            className="text-muted-foreground hover:text-muted-foreground/60"
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
