'use client';

import useSWR from 'swr';

import { Result, SharedLink } from '@/types';
import { fetcher } from '@/lib/utils';

export function useSharedLinks(page: number = 0, limit: number = 5) {
  const offset = page * limit;

  const { data, error, mutate, ...rest } = useSWR<SharedLink[]>(
    `/api/share?limit=${limit}&offset=${offset}`,
    fetcher
  );

  const deleteSharedLink = async (id: string) => {
    try {
      const res = await fetch(`/api/share/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const result: Result = await res.json();
        throw new Error(result.error);
      }
      mutate();
    } catch (err) {
      throw err;
    }
  };

  const deleteAllSharedLinks = async () => {
    try {
      const res = await fetch('/api/share', { method: 'DELETE' });
      if (!res.ok) {
        const result: Result = await res.json();
        throw new Error(result.error);
      }
      mutate();
    } catch (err) {
      throw err;
    }
  };

  return {
    ...rest,
    sharedLinks: data,
    error,
    isError: error,
    hasMore: data ? data.length === limit : true,
    deleteSharedLink,
    deleteAllSharedLinks
  };
}
