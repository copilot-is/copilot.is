import useSWR from 'swr';

import { User } from '@/types';
import { fetcher } from '@/lib/utils';

export function useCurrentUser() {
  const { data, ...rest } = useSWR<User>('/api/users/me', fetcher);

  return { ...rest, user: data };
}
