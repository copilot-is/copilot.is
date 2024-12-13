import { generateId as generateIdFunc } from 'ai';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { ServiceProvider, SupportedModels, TTSModels } from '@/lib/constant';
import { MessageContent } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export const apiFromModel = (value: string): string => {
  const model = SupportedModels.concat(TTSModels).find(m => m.value === value);
  return `/api/${model?.type || 'chat'}/${model?.provider || 'default'}`;
};

export const providerFromModel = (value: string) => {
  const model = SupportedModels.concat(TTSModels).find(m => m.value === value);
  return model?.provider;
};

export const isVisionModel = (value: string): boolean => {
  const model = SupportedModels.find(m => m.value === value);
  return model?.vision ?? false;
};

export const isImageModel = (value: string): boolean => {
  const model = SupportedModels.find(m => m.value === value);
  return model?.type === 'images';
};

export function getMediaTypeFromDataURL(dataURL: string): string | null {
  const matches = dataURL.match(/^data:([A-Za-z-+\/]+);base64/);
  return matches ? matches[1] : null;
}

export function getBase64FromDataURL(dataURL: string): string | null {
  const matches = dataURL.match(/^data:[A-Za-z-+\/]+;base64,(.*)$/);
  return matches ? matches[1] : null;
}

export async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function formatSystemPrompt(model: string, prompt?: string) {
  const provider = providerFromModel(model);
  if (provider && prompt) {
    const time = new Date().toLocaleString();
    const systemPrompt = formatString(prompt, {
      provider: ServiceProvider[provider],
      model,
      time
    });
    return systemPrompt;
  }
}

export function getMessageContentText(content: MessageContent) {
  const IMAGE_DATA_URL_REGEX = /!\[\]\(data:image\/png;base64,.*?\)/g;

  if (Array.isArray(content)) {
    return content
      .map(c =>
        c.type === 'text' ? c.text.replace(IMAGE_DATA_URL_REGEX, '') : ''
      )
      .filter(Boolean)
      .join('\n\n');
  }
  return typeof content === 'string'
    ? content.replace(IMAGE_DATA_URL_REGEX, '')
    : '';
}
