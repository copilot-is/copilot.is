import { Metadata } from 'next';

import Providers from '@/components/console/providers';

export const metadata: Metadata = {
  title: 'Providers'
};

export default function ProvidersPage() {
  return <Providers />;
}
