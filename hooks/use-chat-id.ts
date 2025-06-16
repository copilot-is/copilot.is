import { useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';

export function useChatId(): string | null {
  const params = useParams<{ id?: string }>();
  const pathname = usePathname();

  const chatId = useMemo(() => {
    return params.id || pathname.match(/\/chat\/([^\/]+)/)?.[1] || null;
  }, [params.id, pathname]);

  return chatId;
}
