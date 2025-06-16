import { useState } from 'react';
import { ReasoningUIPart } from '@ai-sdk/ui-utils';
import { CaretDown, CircleNotch, Lightbulb } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MemoizedReactMarkdown } from '@/components/markdown';

export interface ChatMessageReasoningProps {
  isLoading: boolean;
  part: ReasoningUIPart;
}

export function ChatMessageReasoning({
  isLoading,
  part
}: ChatMessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0
    },
    expanded: {
      height: 'auto',
      opacity: 1
    }
  };

  return (
    <div className="mb-2">
      <Button
        variant="link"
        size="sm"
        className="-ml-1 flex items-center gap-1 px-0 text-sm font-normal text-muted-foreground shadow-none hover:text-accent-foreground hover:no-underline"
        onClick={() => {
          setIsExpanded(!isExpanded);
        }}
      >
        {isLoading ? (
          <>
            <CircleNotch className="animate-spin" />
            <span>Thinking</span>
          </>
        ) : (
          <>
            <Lightbulb />
            <span>Thoughts</span>
            <CaretDown
              className={cn('transition-transform', {
                'rotate-180': isExpanded
              })}
            />
          </>
        )}
      </Button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning"
            className="ml-0.5 border-l-2 pl-3 text-sm text-muted-foreground"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {part.details.map((detail, index) =>
              detail.type === 'text' ? (
                <MemoizedReactMarkdown key={index}>
                  {detail.text}
                </MemoizedReactMarkdown>
              ) : (
                '<redacted>'
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
