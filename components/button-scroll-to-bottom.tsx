'use client';

import { useScrollToBottom, useSticky } from 'react-scroll-to-bottom';

import { Button } from '@/components/ui/button';
import { IconArrowDown } from '@/components/ui/icons';

export function ButtonScrollToBottom() {
  const [sticky] = useSticky();
  const scrollToBottom = useScrollToBottom();

  return (
    <Button
      variant="outline"
      size="icon"
      className="absolute bottom-28 left-1/2 z-10 size-8 -translate-x-1/2 rounded-full bg-background transition-opacity duration-300 disabled:cursor-default disabled:opacity-0 sm:right-8"
      disabled={sticky}
      onClick={() => scrollToBottom()}
    >
      <IconArrowDown />
      <span className="sr-only">Scroll to bottom</span>
    </Button>
  );
}
