import { Metadata } from 'next';

import Quotas from '@/components/console/quotas';

export const metadata: Metadata = {
  title: 'Quotas'
};

export default function QuotasPage() {
  return <Quotas />;
}
