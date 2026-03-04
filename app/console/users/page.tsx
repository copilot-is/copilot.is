import { Metadata } from 'next';

import Users from '@/components/console/users';

export const metadata: Metadata = {
  title: 'Users'
};

export default function UsersPage() {
  return <Users />;
}
