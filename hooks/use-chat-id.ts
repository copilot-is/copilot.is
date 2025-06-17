'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';

export function useChatId(): string | null {
  const params = useParams<{ id?: string }>();
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '';

  const chatId = useMemo(() => {
    return params.id || pathname.match(/\/chat\/([^\/]+)/)?.[1] || null;
  }, [params.id, pathname]);

  return chatId;
}
