import { Metadata } from 'next';

import { api } from '@/trpc/server';
import { SettingsSpeech } from '@/components/settings-speech';

export const metadata: Metadata = {
  title: 'Speech Settings'
};

export default async function SpeechSettingsPage() {
  const { ttsModels, speechEnabled } = await api.settings.getSystem();
  const isSpeechAvailable = (ttsModels?.length ?? 0) > 0 && speechEnabled;

  if (!isSpeechAvailable) {
    return null;
  }

  return (
    <section className="w-full">
      <SettingsSpeech />
    </section>
  );
}
