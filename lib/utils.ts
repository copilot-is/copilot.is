import { UIMessagePart, UITools } from 'ai';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

import { ChatMessage, CustomUIDataTypes, Result } from '@/types';
import { DBMessage } from '@/types/message';

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

    formattedString = formattedString.replaceAll(placeholder, value);
  }

  return formattedString;
}

export function getMostRecentUserMessage(messages: ChatMessage[]) {
  const userMessage = messages
    .filter(message => message.role === 'user')
    .at(-1);
  return userMessage;
}

export function convertToChatMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map(message => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, UITools>[],
    metadata: {
      parentId: message.parentId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    }
  }));
}
