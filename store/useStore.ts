import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type {} from '@redux-devtools/extension';

import { Message, User, type Chat } from '@/lib/types';

type State = {
  user: User | null;
  chats: Record<string, Chat>;
  chatDetails: Record<string, Chat>;
  newChatId?: string;
};

type Action = {
  setUser: (user: User) => void;
  setNewChatId: (chatId?: string) => void;
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (
    id: string,
    updates: Partial<Pick<Chat, 'title' | 'shared' | 'usage'>>
  ) => void;
  removeChat: (chatId: string) => void;
  clearChats: () => void;
  addChatDetail: (chat: Chat) => void;
  updateChatDetail: (
    id: string,
    updates: Partial<Pick<Chat, 'title' | 'shared' | 'usage' | 'ungenerated'>>
  ) => void;
  updateChatMessage: (chatId: string, message: Message) => void;
  removeChatMessage: (chatId: string, messageId: string) => void;
};

export const useStore = create<State & Action>()(
  devtools((set, get) => ({
    user: null,
    chats: {},
    chatDetails: {},
    setUser: (user: User) => set({ user }),
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
      updates: Partial<Pick<Chat, 'title' | 'shared' | 'usage'>>
    ) =>
      set(state => {
        if (!state.chats[id]) {
          return state;
        }
        return {
          chats: { ...state.chats, [id]: { ...state.chats[id], ...updates } }
        };
      }),
    removeChat: (chatId: string) =>
      set(state => {
        const newChats = { ...state.chats };
        delete newChats[chatId];
        return { chats: newChats };
      }),
    clearChats: () => set({ chats: {}, chatDetails: {} }),
    addChatDetail: (chat: Chat) =>
      set(state => ({
        chatDetails: { ...state.chatDetails, [chat.id]: chat }
      })),
    updateChatDetail: (
      id: string,
      updates: Partial<Pick<Chat, 'title' | 'shared' | 'usage' | 'ungenerated'>>
    ) =>
      set(state => {
        if (!state.chatDetails[id]) {
          return state;
        }
        return {
          chatDetails: {
            ...state.chatDetails,
            [id]: { ...state.chatDetails[id], ...updates }
          }
        };
      }),
    updateChatMessage: (chatId: string, message: Message) =>
      set(state => {
        if (!state.chatDetails[chatId] || !state.chatDetails[chatId].messages) {
          return state;
        }
        const chat = state.chatDetails[chatId];
        const messageIndex = chat.messages.findIndex(
          msg => msg.id === message.id
        );
        if (messageIndex === -1) {
          return state;
        }
        const updatedMessages = [...chat.messages];
        updatedMessages[messageIndex] = message;
        return {
          chatDetails: {
            ...state.chatDetails,
            [chatId]: { ...chat, messages: updatedMessages }
          }
        };
      }),
    removeChatMessage: (chatId: string, messageId: string) =>
      set(state => {
        if (!state.chatDetails[chatId] || !state.chatDetails[chatId].messages) {
          return state;
        }
        const chat = state.chatDetails[chatId];
        const updatedMessages = chat.messages.filter(
          msg => msg.id !== messageId
        );
        return {
          chatDetails: {
            ...state.chatDetails,
            [chatId]: { ...chat, messages: updatedMessages }
          }
        };
      })
  }))
);
