import { Metadata } from 'next';

import { SettingsGeneral } from '@/components/settings-general';
import { SettingsProfile } from '@/components/settings-profile';

export const metadata: Metadata = {
  title: 'General Settings'
};

export default function GeneralSettingsPage() {
  return (
    <section className="w-full space-y-6">
      <SettingsProfile />
      <SettingsGeneral />
    </section>
  );
}
