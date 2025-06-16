import { Attachment, UIMessage } from '@ai-sdk/ui-utils';

import { Chat, Result, SharedLink, Voice } from '@/types';

const createSpeech = async (model: string, voice: Voice, input: string) => {
  const res = await fetch('/api/audio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, voice, input })
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }

  const json = await res.json();
  return json as { audio: string };
};

const clearChats = async () => {
  const res = await fetch(`/api/chat`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }
};

const updateChat = async (
  chat: Partial<Pick<Chat, 'title' | 'model'>> & {
    id: string;
  }
) => {
  const res = await fetch(`/api/chat/${chat.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(chat)
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }
};

const removeChat = async (id: string) => {
  const res = await fetch(`/api/chat/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }
};

const updateMessage = async (message: UIMessage) => {
  const res = await fetch(`/api/messages/${message.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }

  const json = await res.json();
  return json as UIMessage;
};

const removeMessage = async (id: string) => {
  const res = await fetch(`/api/messages/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }
};

const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/files/upload', {
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

const deleteFile = async (url: string) => {
  const res = await fetch(`/api/files?url=${encodeURIComponent(url)}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }
};

const createShare = async (chatId: string) => {
  const res = await fetch(`/api/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ chatId })
  });

  if (!res.ok) {
    const result = await res.json();
    return { error: result.error } as Result;
  }

  const json = await res.json();
  return json as SharedLink;
};

export const api = {
  createSpeech,
  updateChat,
  removeChat,
  clearChats,
  updateMessage,
  removeMessage,
  uploadFile,
  deleteFile,
  createShare
};
