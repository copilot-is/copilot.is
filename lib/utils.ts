import { generateId } from 'ai';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { ServiceProvider, SupportedModels } from '@/lib/constant';
import { Model, ModelProvider, type Usage } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const chatId = () => generateId(8);

export const messageId = () => generateId(6);

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
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

export const providerFromModel = (value: Model): ModelProvider => {
  const model = SupportedModels.find(m => m.value === value);
  return model ? model.provider : 'openai';
};

export const isVisionModel = (value: Model): boolean => {
  const model = SupportedModels.find(m => m.value === value);
  return model?.vision ?? false;
};

export const isImageModel = (value: Model): boolean => {
  const model = SupportedModels.find(m => m.value === value);
  return model?.image ?? false;
};

export const getSupportedModels = (
  openaiModels?: Model,
  googleModels?: Model,
  anthropicModels?: Model
) => {
  const providers = {
    openai: openaiModels?.split(',') || [],
    google: googleModels?.split(',') || [],
    anthropic: anthropicModels?.split(',') || []
  };

  const supportedModels = SupportedModels.filter(({ value, provider }) => {
    return providers[provider]?.length
      ? providers[provider].includes(value)
      : true;
  }).map(({ value }) => value);

  return supportedModels.length > 0 ? supportedModels : undefined;
};

export function buildChatUsage(usage: Usage): Usage {
  const generalFields = ['model', 'stream', 'previewToken'];
  const providerFields = {
    openai: [
      'temperature',
      'frequencyPenalty',
      'presencePenalty',
      'topP',
      'maxTokens'
    ],
    google: ['temperature', 'topP', 'topK', 'maxTokens'],
    anthropic: ['temperature', 'topP', 'topK', 'maxTokens']
  };

  const image = isImageModel(usage.model);
  const provider = providerFromModel(usage.model);
  const fields = generalFields.concat(providerFields[provider]);

  const newUsage = {} as Usage;

  if (!image && usage.prompt) {
    const model = usage.model;
    const time = new Date().toLocaleString();
    const systemPrompt = formatString(usage.prompt, {
      provider: ServiceProvider[provider],
      model,
      time
    });
    newUsage['prompt'] = systemPrompt;
  }

  for (const field of fields) {
    if (
      usage[field] !== undefined &&
      usage[field] !== null &&
      usage[field] !== ''
    ) {
      newUsage[field] = usage[field];
    }
  }

  return newUsage;
}

export function getMediaTypeFromDataURL(dataURL: string): string | null {
  const matches = dataURL.match(/^data:([A-Za-z-+\/]+);base64/);
  return matches ? matches[1] : null;
}

export function getBase64FromDataURL(dataURL: string): string | null {
  const matches = dataURL.match(/^data:[A-Za-z-+\/]+;base64,(.*)$/);
  return matches ? matches[1] : null;
}
