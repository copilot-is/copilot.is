import { Metadata } from 'next';

import Pricing from '@/components/console/pricing';

export const metadata: Metadata = {
  title: 'Pricing'
};

export default function PricingPage() {
  return <Pricing />;
}
