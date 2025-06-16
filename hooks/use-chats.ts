import { mutate } from 'swr';
import useSWRInfinite, { unstable_serialize as serialize } from 'swr/infinite';

import { Chat, Result } from '@/types';
import { fetcher } from '@/lib/utils';

const LIMIT = 25;

const getKey = (pageIndex: number, previousPageData: Chat[] | null) => {
  if (previousPageData && !previousPageData.length) return null;
  return `/api/chat?limit=${LIMIT}&offset=${pageIndex * LIMIT}`;
};

export function useChatsInfinite() {
  const { data, error, ...rest } = useSWRInfinite<Chat[]>(getKey, fetcher, {
    revalidateOnFocus: false,
    fallbackData: []
  });

  return {
    ...rest,
    chats: data ? ([] as Chat[]).concat(...data) : [],
    error,
    isError: error,
    hasMore: data ? data[data.length - 1]?.length === LIMIT : true
  };
}

export function refreshChats() {
  return mutate(serialize(getKey));
}

export function updateChatInCache(id: string, updated: Partial<Chat>) {
  return mutate(
    serialize(getKey),
    (pages: Chat[][] | undefined) =>
      pages?.map(page =>
        page.map(chat => (chat.id === id ? { ...chat, ...updated } : chat))
      ),
    { revalidate: false }
  );
}

export const updateChat = async (
  updated: Partial<Pick<Chat, 'title' | 'model'>> & { id: string }
) => {
  try {
    await updateChatInCache(updated.id, updated);
    const res = await fetch(`/api/chat/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (!res.ok) {
      const result: Result = await res.json();
      throw new Error(result.error);
    }
    await mutate(serialize(getKey));
  } catch (err) {
    await mutate(serialize(getKey));
    throw err;
  }
};

export const deleteChat = async (id: string) => {
  try {
    await mutate(
      serialize(getKey),
      (pages: Chat[][] | undefined) =>
        pages?.map(page => page.filter(chat => chat.id !== id)),
      { revalidate: false }
    );
    const res = await fetch(`/api/chat/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const result: Result = await res.json();
      throw new Error(result.error);
    }
    await mutate(serialize(getKey));
  } catch (err) {
    await mutate(serialize(getKey));
    throw err;
  }
};

export const clearChats = async () => {
  try {
    await mutate(serialize(getKey), [], { revalidate: false });
    const res = await fetch(`/api/chat`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const result: Result = await res.json();
      throw new Error(result.error);
    }
    await mutate(serialize(getKey));
  } catch (err) {
    await mutate(serialize(getKey));
    throw err;
  }
};
