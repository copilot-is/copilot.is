import { Attachment, ChatMessage, Result } from '@/types';

export const createSpeech = async (
  modelId: string,
  voice: string,
  text: string
) => {
  const res = await fetch('/api/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ modelId, voice, text })
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }

  const json = await res.json();
  return json as { audio: string };
};

export const uploadFile = async (
  file: File,
  type: 'avatar' | 'attachment' = 'attachment'
): Promise<Attachment | Result> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`/api/files/upload?type=${type}`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }

  const json = await res.json();
  return json as Attachment;
};

export const deleteFile = async (url: string) => {
  const res = await fetch(`/api/files?url=${encodeURIComponent(url)}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }
};

export const generateVoice = async (params: {
  id: string;
  modelId: string;
  userMessage: ChatMessage;
  parentMessageId?: string;
  voice: string;
}) => {
  const res = await fetch('/api/audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }

  const json = await res.json();
  return json as {
    title: string;
    assistantMessage: ChatMessage;
  };
};

export const generateImage = async (params: {
  id: string;
  modelId: string;
  userMessage: ChatMessage;
  parentMessageId?: string;
  size?: string;
  aspectRatio?: string;
  n: number;
}) => {
  const res = await fetch('/api/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }

  const json = await res.json();
  return json as {
    title: string;
    assistantMessage: ChatMessage;
  };
};

export const generateVideo = async (params: {
  id: string;
  modelId: string;
  userMessage: ChatMessage;
  parentMessageId?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: number;
}) => {
  const res = await fetch('/api/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }

  const json = await res.json();
  return json as {
    title: string;
    assistantMessage: ChatMessage;
  };
};
