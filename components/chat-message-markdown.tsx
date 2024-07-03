'use client';

import React from 'react';
import { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { CodeBlock } from '@/components/ui/codeblock';
import { MemoizedReactMarkdown } from '@/components/markdown';

interface ChatMessageMarkdownProps {
  content: string;
}

export function ChatMessageMarkdown({ content }: ChatMessageMarkdownProps) {
  return (
    <MemoizedReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      urlTransform={(url, key, node) =>
        key === 'src' && node.tagName === 'img' ? url : defaultUrlTransform(url)
      }
      components={{
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        img({ node, ...props }) {
          return (
            <img
              alt=""
              loading="lazy"
              className="mb-3 mt-0 h-auto w-full max-w-xs"
              {...props}
            />
          );
        },
        code({ node, className, children, ...props }) {
          const childArray = React.Children.toArray(children);
          const firstChild = childArray[0] as React.ReactElement;
          const firstChildAsString = React.isValidElement(firstChild)
            ? (firstChild as React.ReactElement).props.children
            : firstChild;

          if (firstChildAsString === '▍') {
            return <span className="mt-1 animate-pulse cursor-default">▍</span>;
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
  );
}
