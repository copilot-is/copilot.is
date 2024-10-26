'use client';

import * as React from 'react';

import { SystemPrompt } from '@/lib/constant';
import { Voice, type AIToken, type Model, type Settings } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

type SettingsContextProps = {
  allowCustomAPIKey: boolean;
  availableModels: Model[];
  tts: { model?: string; voice?: Voice };
  setTextToSpeech: (key: 'model' | 'voice', value?: string | Voice) => void;
  model: string;
  setModel: (value: string) => void;
  token: AIToken;
  setToken: (key: keyof AIToken, value: AIToken[keyof AIToken]) => void;
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
  defaultTTS = {},
  defaultModel = 'gpt-4o',
  availableModels,
  allowCustomAPIKey = true,
  children
}: {
  defaultTTS?: {
    model?: string;
    voice?: Voice;
  };
  defaultModel?: string;
  availableModels: Model[];
  allowCustomAPIKey?: boolean;
  children: React.ReactNode;
}) => {
  const [token, setToken, tokenLoading] =
    useLocalStorage<SettingsContextProps['token']>('ai-token');
  const [model, setModel, modelLoading] = useLocalStorage<
    SettingsContextProps['model']
  >('model', defaultModel);
  const [tts, setTextToSpeech, ttsLoading] = useLocalStorage<
    SettingsContextProps['tts']
  >('tts', defaultTTS);

  const defaultSettings: Settings = {
    prompt: SystemPrompt,
    temperature: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    maxTokens: 4096
  };
  const [settings, setSettings, modelSettingsLoading] = useLocalStorage<
    SettingsContextProps['settings']
  >('settings', defaultSettings);

  const isLoading =
    tokenLoading && ttsLoading && modelLoading && modelSettingsLoading;

  if (isLoading) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{
        allowCustomAPIKey,
        availableModels,
        tts,
        setTextToSpeech(key: 'model' | 'voice', value?: string | Voice) {
          setTextToSpeech({ ...tts, [key]: value });
        },
        model,
        setModel,
        token,
        setToken: (key: keyof AIToken, value: AIToken[keyof AIToken]) => {
          setToken({ ...token, [key]: value });
        },
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
        }
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
