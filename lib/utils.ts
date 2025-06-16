import { Message, UIMessage } from '@ai-sdk/ui-utils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

import { Result } from '@/types';
import {
  ChatModels,
  ImageModels,
  ServiceProvider,
  TTSModels
} from '@/lib/constant';

import { env } from './env';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const json = await res.json();
    throw { error: json.error } as Result;
  }

  return res.json();
};

export function generateUUID(): string {
  return uuidv4();
}

export function formatString(
  formatString: string,
  args: Record<string, any>
): string {
  let formattedString = formatString;

  for (const name in args) {
    const placeholder = `{${name}}`;
    const value = args[name];

    formattedString = formattedString.replace(placeholder, value);
  }

  return formattedString;
}

export function findModelByValue(value: string) {
  const models = [...ChatModels, ...TTSModels, ...ImageModels];
  return models.find(
    model =>
      model.value === value || (model.alias && model.alias.includes(value))
  );
}

export function isAvailableModel(value: string): boolean {
  const model = findModelByValue(value);
  if (!model) return false;

  switch (model.provider) {
    case 'anthropic':
      return env.ANTHROPIC_ENABLED;
    case 'openai':
      return env.OPENAI_ENABLED;
    case 'google':
      return env.GOOGLE_ENABLED;
    case 'xai':
      return env.XAI_ENABLED;
    case 'deepseek':
      return env.DEEPSEEK_ENABLED;
    default:
      return false;
  }
}

export function systemPrompt(model: string, prompt: string) {
  const provider = findModelByValue(model)?.provider;
  const time = new Date().toLocaleString();
  const system = formatString(prompt, {
    ...(provider ? { provider: ServiceProvider[provider] } : {}),
    model,
    time
  });
  return system;
}

export function getAvailableModels() {
  const availableModels = [
    ...(env.OPENAI_ENABLED
      ? ChatModels.filter(model => {
          if (env.OPENAI_MODELS) {
            const allowed = env.OPENAI_MODELS.split(',');
            return (
              allowed.includes(model.value) ||
              (model.alias &&
                model.alias.some(alias => allowed.includes(alias)))
            );
          }
          return model.provider === 'openai';
        })
      : []),
    ...(env.GOOGLE_ENABLED
      ? ChatModels.filter(model => {
          if (env.GOOGLE_MODELS) {
            const allowed = env.GOOGLE_MODELS.split(',');
            return (
              allowed.includes(model.value) ||
              (model.alias &&
                model.alias.some(alias => allowed.includes(alias)))
            );
          }
          return model.provider === 'google';
        })
      : []),
    ...(env.ANTHROPIC_ENABLED
      ? ChatModels.filter(model => {
          if (env.ANTHROPIC_MODELS) {
            const allowed = env.ANTHROPIC_MODELS.split(',');
            return (
              allowed.includes(model.value) ||
              (model.alias &&
                model.alias.some(alias => allowed.includes(alias)))
            );
          }
          return model.provider === 'anthropic';
        })
      : []),
    ...(env.XAI_ENABLED
      ? ChatModels.filter(model => {
          if (env.XAI_MODELS) {
            const allowed = env.XAI_MODELS.split(',');
            return (
              allowed.includes(model.value) ||
              (model.alias &&
                model.alias.some(alias => allowed.includes(alias)))
            );
          }
          return model.provider === 'xai';
        })
      : []),
    ...(env.DEEPSEEK_ENABLED
      ? ChatModels.filter(model => {
          if (env.DEEPSEEK_MODELS) {
            const allowed = env.DEEPSEEK_MODELS.split(',');
            return (
              allowed.includes(model.value) ||
              (model.alias &&
                model.alias.some(alias => allowed.includes(alias)))
            );
          }
          return model.provider === 'deepseek';
        })
      : [])
  ];

  return availableModels;
}

export function getMostRecentUserMessage(messages: (UIMessage | Message)[]) {
  const userMessage = messages
    .filter(message => message.role === 'user')
    .at(-1);
  return userMessage as UIMessage;
}
