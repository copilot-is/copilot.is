import {
  APIConfig,
  Message,
  Result,
  User,
  Voice,
  type Chat,
  type Usage
} from '@/lib/types';

const createAI = async (
  api: string,
  messages: { role: string; content: string }[],
  usage: Usage,
  config?: APIConfig
) => {
  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages, usage, config })
  });

  const json = await res.json();

  if (!res.ok) {
    return { error: json.error } as Result;
  }

  return json as { role: string; content: string };
};

const createAudio = async (
  api: string,
  voice: Voice,
  input: string,
  usage: Usage,
  config?: APIConfig
) => {
  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ voice, input, usage, config })
  });

  const json = await res.json();

  if (!res.ok) {
    return { error: json.error } as Result;
  }

  return json as { audio: string };
};

const getCurrentUser = async () => {
  const res = await fetch('/api/users/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const json = await res.json();

  if (!res.ok) {
    return { error: json.error } as Result;
  }

  return json as User;
};

const createChat = async (
  chatId: string,
  usage: Usage,
  messages: Message[],
  regenerateId?: string
) => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ chatId, usage, messages, regenerateId })
  });

  const json = await res.json();

  if (!res.ok) {
    return { error: json.error } as Result;
  }

  return json as Chat;
};

const getChats = async () => {
  const res = await fetch('/api/chat', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const json = await res.json();

  if (!res.ok) {
    return { error: json.error } as Result;
  }

  return json as Chat[];
};

const getChatById = async (chatId: string) => {
  const res = await fetch(`/api/chat/${chatId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const json = await res.json();

  if (!res.ok) {
    return { error: json.error } as Result;
  }

  return json as Chat;
};

const clearChats = async () => {
  const res = await fetch(`/api/chat`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const json = await res.json();
    return { error: json.error } as Result;
  }
};

const updateChat = async (
  chatId: string,
  chat: Partial<Pick<Chat, 'title' | 'shared' | 'usage'>>
) => {
  const res = await fetch(`/api/chat/${chatId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(chat)
  });

  const json = await res.json();

  if (!res.ok) {
    return { error: json.error } as Result;
  }

  return json as Chat;
};

const removeChat = async (chatId: string) => {
  const res = await fetch(`/api/chat/${chatId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const json = await res.json();
    return { error: json.error } as Result;
  }
};

const updateMessage = async (
  chatId: string,
  messageId: string,
  message: Message
) => {
  const res = await fetch(`/api/chat/${chatId}/messages/${messageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ chatId, messageId, message })
  });

  const json = await res.json();

  if (!res.ok) {
    return { error: json.error } as Result;
  }

  return json as Message;
};

const removeMessage = async (chatId: string, messageId: string) => {
  const res = await fetch(`/api/chat/${chatId}/messages/${messageId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const json = await res.json();
    return { error: json.error } as Result;
  }
};

export const api = {
  createAI,
  createAudio,
  getCurrentUser,
  createChat,
  getChats,
  getChatById,
  updateChat,
  removeChat,
  clearChats,
  updateMessage,
  removeMessage
};
