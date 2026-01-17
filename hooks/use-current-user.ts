'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import useSWR from 'swr';

import { User } from '@/types';
import { fetcher } from '@/lib/utils';

export function useCurrentUser() {
  const { data, error, ...rest } = useSWR<User>('/api/users/me', fetcher);

  useEffect(() => {
    // Auto sign out if fetching user info fails
    if (error) {
      signOut({ callbackUrl: '/login' });
    }
  }, [error]);

  return { ...rest, error, user: data };
}
