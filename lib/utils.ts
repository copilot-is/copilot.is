import { generateId as generateIdFunc } from 'ai';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { ServiceProvider, SupportedModels } from '@/lib/constant';
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

export const apiFromModel = (value: Model): string => {
  const model = SupportedModels.find(m => m.value === value);
  return model?.api || `/api/chat/${model?.provider}`;
};

export const providerFromModel = (value: Model): ModelProvider => {
  const model = SupportedModels.find(m => m.value === value);
  return model ? model.provider : 'openai';
};

export const isVisionModel = (value: Model): boolean => {
  const model = SupportedModels.find(m => m.value === value);
  return model?.vision ?? false;
};

export const getSupportedModels = (
  availableModels: Record<string, Model[]>
) => {
  const supportedModels = SupportedModels.filter(({ value, provider }) => {
    return availableModels[provider].length
      ? availableModels[provider].includes(value)
      : true;
  });

  return supportedModels;
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

export function formatSystemPrompt(model: Model, prompt?: string) {
  if (prompt) {
    const provider = providerFromModel(model);
    const time = new Date().toLocaleString();
    const systemPrompt = formatString(prompt, {
      provider: ServiceProvider[provider],
      model,
      time
    });
    return systemPrompt;
  }
}
