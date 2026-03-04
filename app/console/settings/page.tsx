import { Metadata } from 'next';

import Settings from '@/components/console/settings';

export const metadata: Metadata = {
  title: 'Settings'
};

export default function SettingsPage() {
  return <Settings />;
}
