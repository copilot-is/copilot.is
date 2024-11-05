'use client';

import * as React from 'react';

import { SystemPrompt } from '@/lib/constant';
import {
  APIConfigs,
  APIParameter,
  APIProvider,
  Provider,
  Voice,
  type Model,
  type Settings,
  type TTS
} from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

type SettingsContextProps = {
  apiCustomEnabled: boolean;
  availableModels: Model[];
  tts: TTS;
  setTextToSpeech: (key: 'model' | 'voice', value?: string | Voice) => void;
  model: string;
  setModel: (value: string) => void;
  settings: Settings;
  setSettings: (key: keyof Settings, value: Settings[keyof Settings]) => void;
  apiConfigs: APIConfigs;
  setAPIConfigs: (
    provider: Provider | APIProvider,
    key: APIParameter,
    value?: string
  ) => void;
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
  defaultTTS = {},
  defaultModel = 'gpt-4o',
  availableModels,
  apiCustomEnabled = true,
  apiProvider,
  children
}: {
  defaultTTS?: TTS;
  defaultModel?: string;
  availableModels: Model[];
  apiCustomEnabled?: boolean;
  apiProvider: Partial<Record<Provider, { provider?: APIProvider }>>;
  children: React.ReactNode;
}) => {
  const [model, setModel, modelLoading] = useLocalStorage<
    SettingsContextProps['model']
  >('model', defaultModel);
  const [tts, setTextToSpeech, ttsLoading] = useLocalStorage<
    SettingsContextProps['tts']
  >('tts', { model: defaultTTS.model, voice: defaultTTS.voice });
  const [apiConfigs, setAPIConfigs, configsLoading] = useLocalStorage<
    SettingsContextProps['apiConfigs']
  >('configs', apiProvider);

  const defaultSettings: Settings = {
    prompt: SystemPrompt,
    temperature: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    maxTokens: 4096
  };
  const [settings, setSettings, settingsLoading] = useLocalStorage<
    SettingsContextProps['settings']
  >('settings', defaultSettings);

  const isLoading =
    ttsLoading && modelLoading && configsLoading && settingsLoading;

  if (isLoading) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{
        apiCustomEnabled,
        availableModels,
        tts: { ...tts, enabled: defaultTTS.enabled },
        setTextToSpeech(key: 'model' | 'voice', value?: string | Voice) {
          setTextToSpeech({ ...tts, [key]: value });
        },
        model,
        setModel,
        settings,
        setSettings: (key: keyof Settings, value: Settings[keyof Settings]) => {
          if (value === null || value === undefined) {
            if (settings[key] !== defaultSettings[key]) {
              setSettings({
                ...settings,
                [key]: defaultSettings[key]
              });
            }
          } else {
            setSettings({
              ...settings,
              [key]: value
            });
          }
        },
        apiConfigs,
        setAPIConfigs: (
          provider: Provider | APIProvider,
          key: APIParameter,
          value?: string
        ) => {
          setAPIConfigs({
            ...apiConfigs,
            [provider]: {
              ...apiConfigs[provider],
              [key]: value === '' ? undefined : value
            }
          });
        }
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
