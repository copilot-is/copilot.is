import { useState } from 'react';
import { CaretDown, CircleNotch, Lightbulb } from '@phosphor-icons/react';
import { ReasoningUIPart } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MemoizedReactMarkdown } from '@/components/markdown';

export interface MessageReasoningProps {
  isLoading: boolean;
  part: ReasoningUIPart;
}

export function MessageReasoning({ isLoading, part }: MessageReasoningProps) {
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

  const showReasoning = isLoading || (part.text && part.text.trim().length > 0);
  if (!showReasoning) {
    return null;
  }

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
            <MemoizedReactMarkdown>{part.text}</MemoizedReactMarkdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
