'use client';

import * as React from 'react';

import { SystemPrompt } from '@/lib/constant';
import {
  Voice,
  type AIToken,
  type ModelProfile,
  type ModelSettings
} from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

type SettingsContextProps = {
  allowCustomAPIKey: boolean;
  availableModels: ModelProfile[];
  tts: { model?: string; voice?: Voice };
  setTextToSpeech: (key: 'model' | 'voice', value?: string | Voice) => void;
  model: string;
  setModel: (value: string) => void;
  token: AIToken;
  setToken: (key: keyof AIToken, value: AIToken[keyof AIToken]) => void;
  modelSettings: ModelSettings;
  setModelSettings: (
    key: keyof ModelSettings,
    value: ModelSettings[keyof ModelSettings]
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
  allowCustomAPIKey = true,
  children
}: {
  defaultTTS?: {
    model?: string;
    voice?: Voice;
  };
  defaultModel?: string;
  availableModels: ModelProfile[];
  allowCustomAPIKey?: boolean;
  children: React.ReactNode;
}) => {
  const [token, setToken, tokenLoading] =
    useLocalStorage<SettingsContextProps['token']>('ai-token');
  const [model, setModel, modelLoading] = useLocalStorage<
    SettingsContextProps['model']
  >('ai-model', defaultModel);
  const [tts, setTextToSpeech, ttsLoading] = useLocalStorage<
    SettingsContextProps['tts']
  >('ai-tts', defaultTTS);

  const defaultModelSettings: ModelSettings = {
    prompt: SystemPrompt,
    temperature: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    maxTokens: 4096
  };
  const [modelSettings, setModelSettings, modelSettingsLoading] =
    useLocalStorage<SettingsContextProps['modelSettings']>(
      'ai-model-settings',
      defaultModelSettings
    );

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
        modelSettings,
        setModelSettings: (
          key: keyof ModelSettings,
          value: ModelSettings[keyof ModelSettings]
        ) => {
          if (value === null || value === undefined) {
            if (modelSettings[key] !== defaultModelSettings[key]) {
              setModelSettings({
                ...modelSettings,
                [key]: defaultModelSettings[key]
              });
            }
          } else {
            setModelSettings({
              ...modelSettings,
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
