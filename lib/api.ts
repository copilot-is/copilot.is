import toast from 'react-hot-toast';

import {
  Message,
  ModelProvider,
  User,
  type Chat,
  type Usage
} from '@/lib/types';

const createAI = async (
  provider: ModelProvider,
  messages: { role: string; content: string }[],
  usage: Usage
) => {
  const res = await fetch(`/api/chat/${provider}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages, usage })
  });

  const json = await res.json();

  if (!res.ok) {
    toast.error(json.error);
  }

  return json as { role: string; content: string };
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
    toast.error(json.error);
  }

  return json as User;
};

const createChat = async (
  chatId: string,
  regenerateId: string | undefined | null,
  usage: Usage,
  messages: Message[]
) => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ chatId, regenerateId, usage, messages })
  });

  const json = await res.json();

  if (!res.ok) {
    toast.error(json.error);
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
    toast.error(json.error);
  }

  return json as Chat[];
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
    toast.error(json.error);
  }
};

const updateChat = async (
  chatId: string,
  chat: Partial<Pick<Chat, 'title' | 'sharing' | 'usage'>>
) => {
  const res = await fetch(`/api/chat/${chatId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ chat })
  });

  const json = await res.json();

  if (!res.ok) {
    toast.error(json.error);
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
    toast.error(json.error);
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
    toast.error(json.error);
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
    toast.error(json.error);
  }
};

export const api = {
  createAI,
  getCurrentUser,
  createChat,
  getChats,
  updateChat,
  removeChat,
  clearChats,
  updateMessage,
  removeMessage
};
