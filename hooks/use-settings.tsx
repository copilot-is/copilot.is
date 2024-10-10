'use client';

import * as React from 'react';

import { SystemPrompt } from '@/lib/constant';
import {
  Model,
  type AIToken,
  type ModelProfile,
  type ModelSettings
} from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

type SettingsContextProps = {
  allowCustomAPIKey: boolean;
  availableModels: ModelProfile[];
  model: Model;
  setModel: (value: Model) => void;
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
  defaultModel = 'gpt-3.5-turbo',
  availableModels,
  allowCustomAPIKey = true,
  children
}: {
  defaultModel?: Model;
  availableModels: ModelProfile[];
  allowCustomAPIKey?: boolean;
  children: React.ReactNode;
}) => {
  const [token, setToken, tokenLoading] =
    useLocalStorage<SettingsContextProps['token']>('ai-token');
  const [model, setModel, modelLoading] = useLocalStorage<
    SettingsContextProps['model']
  >('ai-model', defaultModel);

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

  const isLoading = tokenLoading && modelLoading && modelSettingsLoading;

  if (isLoading) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{
        allowCustomAPIKey,
        availableModels,
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
          if (value === null) {
            if (modelSettings[key] !== defaultModelSettings[key]) {
              setModelSettings({
                ...modelSettings,
                [key]: defaultModelSettings[key]
              });
            }
          } else {
            setModelSettings({
              ...modelSettings,
              [key]: value || defaultModelSettings[key]
            });
          }
        }
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
