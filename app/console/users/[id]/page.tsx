import { Metadata } from 'next';

import UserDetail from '@/components/console/user-detail';

export const metadata: Metadata = {
  title: 'User usage limits'
};

export default async function UserDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserDetail userId={id} />;
}
