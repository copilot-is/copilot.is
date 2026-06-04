import { Metadata } from 'next';

import Plans from '@/components/console/plans';

export const metadata: Metadata = {
  title: 'Plans'
};

export default function PlansPage() {
  return <Plans />;
}
