import { Metadata } from 'next';

import { SharedLinks } from '@/components/shared-links';

export const metadata: Metadata = {
  title: 'Shared Links Settings'
};

export default function SharedLinksSettingsPage() {
  return <SharedLinks />;
}
