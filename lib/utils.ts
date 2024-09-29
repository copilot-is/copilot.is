import { generateId as generateIdFunc } from 'ai';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { SupportedModels } from '@/lib/constant';
import { Model, ModelProvider } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateId = () => generateIdFunc(10);

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
