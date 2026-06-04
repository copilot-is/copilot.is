import { Metadata } from 'next';

import Usage from '@/components/console/usage';

export const metadata: Metadata = {
  title: 'Usage'
};

export default function UsagePage() {
  return <Usage />;
}
