'use client';

import * as React from 'react';

import { ChatPreferences, SystemSettings, UserSettings } from '@/types';
import { findModelByValue } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';

type SettingsContextProps = {
  systemSettings: SystemSettings;
  userSettings: UserSettings;
  setUserSettings: (
    key: keyof UserSettings,
    value?: UserSettings[keyof UserSettings] | null
  ) => void;
  chatPreferences: ChatPreferences;
  setChatPreferences: (
    key: keyof ChatPreferences,
    value?: ChatPreferences[keyof ChatPreferences] | null
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
  defaultSystemSettings,
  defaultUserSettings,
  defaultChatPreferences,
  children
}: {
  defaultSystemSettings: SystemSettings;
  defaultUserSettings: UserSettings;
  defaultChatPreferences: ChatPreferences;
  children: React.ReactNode;
}) => {
  const [userSettings, setUserSettings, userSettingsLoading] =
    useLocalStorage<UserSettings>('user-settings', defaultUserSettings);
  const [chatPreferences, setChatPreferences, userChatPreferences] =
    useLocalStorage<ChatPreferences>(
      'chat-preferences',
      defaultChatPreferences
    );

  const isLoading = userSettingsLoading && userChatPreferences;

  if (isLoading) {
    return null;
  }

  function getChatPreferences(
    chatPreferences: ChatPreferences
  ): ChatPreferences {
    const isReasoning = findModelByValue(chatPreferences.model)?.options
      ?.isReasoning;
    if (!isReasoning) {
      const { isReasoning, ...rest } = chatPreferences;
      return rest;
    }
    return chatPreferences;
  }

  return (
    <SettingsContext.Provider
      value={{
        systemSettings: defaultSystemSettings,
        userSettings,
        setUserSettings: (
          key: keyof UserSettings,
          value?: UserSettings[keyof UserSettings] | null
        ) => {
          if (value === null || value === undefined) {
            if (userSettings[key] !== defaultUserSettings[key]) {
              setUserSettings({
                ...userSettings,
                [key]: defaultUserSettings[key]
              });
            }
          } else {
            setUserSettings({
              ...userSettings,
              [key]: value
            });
          }
        },
        chatPreferences: getChatPreferences(chatPreferences),
        setChatPreferences: (
          key: keyof ChatPreferences,
          value?: ChatPreferences[keyof ChatPreferences] | null
        ) => {
          if (value === null || value === undefined) {
            if (chatPreferences[key] !== defaultChatPreferences[key]) {
              setChatPreferences({
                ...chatPreferences,
                [key]: defaultChatPreferences[key]
              });
            }
          } else {
            setChatPreferences({
              ...chatPreferences,
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
