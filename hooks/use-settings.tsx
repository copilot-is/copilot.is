'use client';

import * as React from 'react';

import {
  ChatPreferences,
  ImagePreferences,
  SystemSettings,
  UserSettings,
  VideoPreferences,
  VoicePreferences
} from '@/types';
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
  videoPreferences: VideoPreferences;
  setVideoPreferences: (
    key: keyof VideoPreferences,
    value?: VideoPreferences[keyof VideoPreferences] | null
  ) => void;
  voicePreferences: VoicePreferences;
  setVoicePreferences: (
    key: keyof VoicePreferences,
    value?: VoicePreferences[keyof VoicePreferences] | null
  ) => void;
  imagePreferences: ImagePreferences;
  setImagePreferences: (
    key: keyof ImagePreferences,
    value?: ImagePreferences[keyof ImagePreferences] | null
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
  defaultVideoPreferences,
  defaultVoicePreferences,
  defaultImagePreferences,
  children
}: {
  defaultSystemSettings: SystemSettings;
  defaultUserSettings: UserSettings;
  defaultChatPreferences: ChatPreferences;
  defaultVideoPreferences: VideoPreferences;
  defaultVoicePreferences: VoicePreferences;
  defaultImagePreferences: ImagePreferences;
  children: React.ReactNode;
}) => {
  const [userSettings, setUserSettings, userSettingsLoading] =
    useLocalStorage<UserSettings>('user-settings', defaultUserSettings);
  const [chatPreferences, setChatPreferences, chatPreferencesLoading] =
    useLocalStorage<ChatPreferences>(
      'chat-preferences',
      defaultChatPreferences
    );
  const [videoPreferences, setVideoPreferences, videoPreferencesLoading] =
    useLocalStorage<VideoPreferences>(
      'video-preferences',
      defaultVideoPreferences
    );
  const [voicePreferences, setVoicePreferences, voicePreferencesLoading] =
    useLocalStorage<VoicePreferences>(
      'voice-preferences',
      defaultVoicePreferences
    );
  const [imagePreferences, setImagePreferences, imagePreferencesLoading] =
    useLocalStorage<ImagePreferences>(
      'image-preferences',
      defaultImagePreferences
    );

  const isLoading =
    userSettingsLoading ||
    chatPreferencesLoading ||
    videoPreferencesLoading ||
    voicePreferencesLoading ||
    imagePreferencesLoading;

  if (isLoading) {
    return null;
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
        chatPreferences,
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
        },
        videoPreferences,
        setVideoPreferences: (
          key: keyof VideoPreferences,
          value?: VideoPreferences[keyof VideoPreferences] | null
        ) => {
          if (value === null || value === undefined) {
            if (videoPreferences[key] !== defaultVideoPreferences[key]) {
              setVideoPreferences({
                ...videoPreferences,
                [key]: defaultVideoPreferences[key]
              });
            }
          } else {
            setVideoPreferences({
              ...videoPreferences,
              [key]: value
            });
          }
        },
        voicePreferences,
        setVoicePreferences: (
          key: keyof VoicePreferences,
          value?: VoicePreferences[keyof VoicePreferences] | null
        ) => {
          if (value === null || value === undefined) {
            if (voicePreferences[key] !== defaultVoicePreferences[key]) {
              setVoicePreferences({
                ...voicePreferences,
                [key]: defaultVoicePreferences[key]
              });
            }
          } else {
            setVoicePreferences({
              ...voicePreferences,
              [key]: value
            });
          }
        },
        imagePreferences,
        setImagePreferences: (
          key: keyof ImagePreferences,
          value?: ImagePreferences[keyof ImagePreferences] | null
        ) => {
          if (value === null || value === undefined) {
            if (imagePreferences[key] !== defaultImagePreferences[key]) {
              setImagePreferences({
                ...imagePreferences,
                [key]: defaultImagePreferences[key]
              });
            }
          } else {
            setImagePreferences({
              ...imagePreferences,
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
