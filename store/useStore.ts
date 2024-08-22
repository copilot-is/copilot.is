import { create } from 'zustand';

import { Chat } from '@/lib/types';

type State = {
  chats: Record<string, Chat>;
  newChatId?: string;
};

type Action = {
  setNewChatId: (chatId?: string) => void;
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (
    id: string,
    updates: Partial<Pick<Chat, 'title' | 'sharing' | 'usage'>>
  ) => void;
  removeChat: (id: string) => void;
  clearChats: () => void;
};

export const useStore = create<State & Action>((set, get) => ({
  chats: {},
  newChatId: undefined,
  setNewChatId: (chatId?: string) => set({ newChatId: chatId }),
  setChats: (chats: Chat[]) =>
    set(() => ({
      chats: chats.reduce(
        (acc, chat) => {
          acc[chat.id] = chat;
          return acc;
        },
        {} as Record<string, Chat>
      )
    })),
  addChat: (chat: Chat) =>
    set(state => ({
      chats: { ...state.chats, [chat.id]: chat }
    })),
  updateChat: (
    id: string,
    updates: Partial<Pick<Chat, 'title' | 'sharing' | 'usage'>>
  ) =>
    set(state => ({
      chats: { ...state.chats, [id]: { ...state.chats[id], ...updates } }
    })),
  removeChat: (id: string) =>
    set(state => {
      const newChats = { ...state.chats };
      delete newChats[id];
      return { chats: newChats };
    }),
  clearChats: () => set({ chats: {} })
}));
