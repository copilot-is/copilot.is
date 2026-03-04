import { useState } from 'react';
import { ReasoningUIPart } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Lightbulb, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MemoizedReactMarkdown } from '@/components/markdown';

export interface MessageReasoningProps {
  isLoading: boolean;
  isWaiting?: boolean;
  part: ReasoningUIPart;
}

export function MessageReasoning({
  isLoading,
  isWaiting,
  part
}: MessageReasoningProps) {
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

  const text = part.text || (part as any).reasoning || '';
  const hasText = text.trim().length > 0;

  // Keep showing if it's loading, if it has text, or if we are still waiting for the first piece of normal text to arrive.
  const showThinking = isLoading || (isWaiting && !hasText);
  const showReasoning = hasText || showThinking;

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
        disabled={!hasText}
      >
        {showThinking ? (
          <>
            <Loader2 className="animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Thinking...</span>
          </>
        ) : (
          <>
            <Lightbulb />
            <span>Thoughts</span>
            <ChevronDown
              className={cn('transition-transform', {
                'rotate-180': isExpanded
              })}
            />
          </>
        )}
      </Button>
      <AnimatePresence initial={false}>
        {isExpanded && hasText && (
          <motion.div
            key="reasoning"
            className="ml-[3px] border-l-2 pl-3 text-sm text-muted-foreground"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <MemoizedReactMarkdown>{text}</MemoizedReactMarkdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
