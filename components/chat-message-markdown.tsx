import React from 'react';
import remarkGfm from 'remark-gfm';

import { CodeBlock } from '@/components/ui/codeblock';
import { MemoizedReactMarkdown } from '@/components/markdown';

interface ChatMessageMarkdownProps {
  content: string;
}

export function ChatMessageMarkdown({ content }: ChatMessageMarkdownProps) {
  return (
    <div className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0 prose-hr:my-3 [&_li_p]:!my-0">
      <MemoizedReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const childArray = React.Children.toArray(children);
            const firstChild = childArray[0] as React.ReactElement<any>;
            const firstChildAsString = React.isValidElement(firstChild)
              ? (firstChild as React.ReactElement<any>).props.children
              : firstChild;

            if (firstChildAsString === '▍') {
              return (
                <span className="mt-1 animate-pulse cursor-default">▍</span>
              );
            }

            if (typeof firstChildAsString === 'string') {
              childArray[0] = firstChildAsString.replace('`▍`', '▍');
            }

            const match = /language-(\w+)/.exec(className || '');

            if (
              typeof firstChildAsString === 'string' &&
              !firstChildAsString.includes('\n')
            ) {
              return (
                <code className={className} {...props}>
                  {childArray}
                </code>
              );
            }

            return (
              <CodeBlock
                key={Math.random()}
                language={(match && match[1]) || ''}
                value={String(childArray).replace(/\n$/, '')}
                {...props}
              />
            );
          }
        }}
      >
        {content}
      </MemoizedReactMarkdown>
    </div>
  );
}
