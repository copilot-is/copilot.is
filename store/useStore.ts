import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type {} from '@redux-devtools/extension';

import { Message, User, type Chat } from '@/lib/types';

type State = {
  user: User | null;
  chats: Record<string, Chat>;
  newChatId?: string;
};

type Action = {
  setUser: (user: User) => void;
  setNewChatId: (chatId?: string) => void;
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (
    chat: Partial<
      Pick<Chat, 'title' | 'shared' | 'usage' | 'messages' | 'ungenerated'>
    > & {
      id: string;
    }
  ) => void;
  removeChat: (chatId: string) => void;
  clearChats: () => void;
  updateMessage: (chatId: string, message: Message) => void;
  removeMessage: (chatId: string, messageId: string) => void;
};

export const useStore = create<State & Action>()(
  devtools((set, get) => ({
    user: null,
    chats: {},
    setUser: (user: User) => set({ user }),
    newChatId: undefined,
    setNewChatId: (chatId?: string) => set({ newChatId: chatId }),
    setChats: (chats: Chat[]) =>
      set(state => ({
        chats: chats.reduce(
          (acc, chat) => {
            if (state.chats[chat.id]) {
              return acc;
            }
            return {
              ...acc,
              [chat.id]: chat
            };
          },
          { ...state.chats } as Record<string, Chat>
        )
      })),
    addChat: (chat: Chat) =>
      set(state => ({
        chats: { ...state.chats, [chat.id]: chat }
      })),
    updateChat: (
      chat: Partial<
        Pick<Chat, 'title' | 'shared' | 'usage' | 'messages' | 'ungenerated'>
      > & {
        id: string;
      }
    ) =>
      set(state => ({
        chats: state.chats[chat.id]
          ? {
              ...state.chats,
              [chat.id]: { ...state.chats[chat.id], ...chat }
            }
          : state.chats
      })),
    removeChat: (chatId: string) =>
      set(state => {
        const newChats = { ...state.chats };
        delete newChats[chatId];
        return { chats: newChats };
      }),
    clearChats: () => set({ chats: {} }),
    updateMessage: (chatId: string, message: Message) =>
      set(state => {
        if (!state.chats[chatId]?.messages) {
          return state;
        }
        const chat = state.chats[chatId];
        const messageIndex = chat.messages.findIndex(m => m.id === message.id);
        if (messageIndex === -1) {
          return state;
        }
        const updatedMessages = [...chat.messages];
        updatedMessages[messageIndex] = message;
        return {
          chats: {
            ...state.chats,
            [chatId]: { ...chat, messages: updatedMessages }
          }
        };
      }),
    removeMessage: (chatId: string, messageId: string) =>
      set(state => {
        if (!state.chats[chatId]?.messages) {
          return state;
        }
        const chat = state.chats[chatId];
        const updatedMessages = chat.messages.filter(m => m.id !== messageId);
        return {
          chats: {
            ...state.chats,
            [chatId]: { ...chat, messages: updatedMessages }
          }
        };
      })
  }))
);
