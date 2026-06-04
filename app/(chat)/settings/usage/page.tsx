import { Metadata } from 'next';

import { SettingsUsage } from '@/components/settings-usage';

export const metadata: Metadata = {
  title: 'Usage'
};

export default function UsagePage() {
  return <SettingsUsage />;
}
