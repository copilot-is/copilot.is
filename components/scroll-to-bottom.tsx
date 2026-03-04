'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from 'react';

// ============================================================================
// Types
// ============================================================================

interface ScrollToBottomOptions {
  behavior?: ScrollBehavior;
}

interface ScrollContextValue {
  containerRef: RefObject<HTMLDivElement | null>;
  endRef: RefObject<HTMLDivElement | null>;
  isAtBottom: boolean;
  scrollToBottom: (options?: ScrollToBottomOptions) => void;
}

// ============================================================================
// Context
// ============================================================================

const ScrollContext = createContext<ScrollContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface ScrollToBottomProps {
  children: ReactNode;
  className?: string;
  button?: ReactNode;
}

export function ScrollToBottom({
  children,
  className,
  button
}: ScrollToBottomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((options?: ScrollToBottomOptions) => {
    endRef.current?.scrollIntoView({
      behavior: options?.behavior ?? 'smooth',
      block: 'end'
    });
  }, []);

  // Scroll to bottom on initial mount
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Consider "at bottom" if within 50px of the bottom
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
    };

    // Initial check
    handleScroll();

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <ScrollContext.Provider
      value={{ containerRef, endRef, isAtBottom, scrollToBottom }}
    >
      <div className="relative size-full">
        <div ref={containerRef} className={className}>
          {children}
          <div ref={endRef} />
        </div>
        {button}
      </div>
    </ScrollContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Returns a function to scroll to the bottom of the container
 */
export function useScrollToBottom(): (options?: ScrollToBottomOptions) => void {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScrollToBottom must be used within a ScrollToBottom');
  }
  return context.scrollToBottom;
}

/**
 * Returns whether the scroll is currently at the bottom (sticky)
 * Compatible with react-scroll-to-bottom's useSticky API
 */
export function useSticky(): [boolean] {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useSticky must be used within a ScrollToBottom');
  }
  return [context.isAtBottom];
}

/**
 * Returns both sticky state and scroll function
 */
export function useScrollContext(): ScrollContextValue {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScrollContext must be used within a ScrollToBottom');
  }
  return context;
}

// Default export for dynamic import compatibility
export default ScrollToBottom;
