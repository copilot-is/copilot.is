'use client';

import * as React from 'react';

import { DefaultSettings } from '@/lib/constant';
import {
  Provider,
  Voice,
  type Model,
  type Settings,
  type TTS
} from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

type SettingsContextProps = {
  availableModels: Model[];
  generateTitleModels: Partial<Record<Provider, string>>;
  tts: TTS;
  setTextToSpeech: (key: 'model' | 'voice', value?: string | Voice) => void;
  model: string;
  setModel: (value: string) => void;
  settings: Settings;
  setSettings: (key: keyof Settings, value: Settings[keyof Settings]) => void;
};

const SettingsContext = React.createContext<SettingsContextProps | undefined>(
  undefined
);

export const useSettings = (): SettingsContextProps => {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({
  defaultTTS,
  defaultModel,
  availableModels,
  generateTitleModels,
  children
}: {
  defaultTTS: TTS;
  defaultModel: string;
  availableModels: Model[];
  generateTitleModels: Partial<Record<Provider, string>>;
  children: React.ReactNode;
}) => {
  const [model, setModel, modelLoading] = useLocalStorage<
    SettingsContextProps['model']
  >('model', defaultModel);
  const [tts, setTextToSpeech, ttsLoading] = useLocalStorage<
    SettingsContextProps['tts']
  >('tts', { model: defaultTTS.model, voice: defaultTTS.voice });

  const [settings, setSettings, settingsLoading] = useLocalStorage<
    SettingsContextProps['settings']
  >('settings', DefaultSettings);

  const isLoading = ttsLoading && modelLoading && settingsLoading;

  if (isLoading) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{
        availableModels,
        generateTitleModels,
        tts: { ...tts, enabled: defaultTTS.enabled },
        setTextToSpeech(key: 'model' | 'voice', value?: string | Voice) {
          setTextToSpeech({ ...tts, [key]: value });
        },
        model,
        setModel,
        settings,
        setSettings: (key: keyof Settings, value: Settings[keyof Settings]) => {
          if (value === null || value === undefined) {
            if (settings[key] !== DefaultSettings[key]) {
              setSettings({
                ...settings,
                [key]: DefaultSettings[key]
              });
            }
          } else {
            setSettings({
              ...settings,
              [key]: value
            });
          }
        }
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
