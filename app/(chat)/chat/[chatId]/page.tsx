'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { ChatNotFound } from '@/components/chat-notfound';
import { ChatSpinner } from '@/components/chat-spinner';
import { ChatUI } from '@/components/chat-ui';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export interface ChatPageProps {
  params: {
    chatId: string;
  };
}

const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME;

export default function ChatPage({ params }: ChatPageProps) {
  const chatId = params.chatId;
  const [isLoading, setIsLoading] = useState(false);
  const { chatDetails, addChatDetail } = useStore();
  const [notFound, setNotFound] = useState(false);

  const chat = chatDetails[chatId];
  const title = chat?.title;

  useEffect(() => {
    if (title) {
      document.title = `${title} - ${PRODUCT_NAME}`;
    }
  }, [title]);

  useEffect(() => {
    const fetchData = async () => {
      if (!chat) {
        setIsLoading(true);
        const result = await api.getChatById(chatId);
        if (result && 'error' in result) {
          setNotFound(true);
        } else {
          addChatDetail(result);
        }
        setIsLoading(false);
      }
    };

    fetchData();
  }, [chatId, chat, addChatDetail]);

  return isLoading ? (
    <ChatSpinner />
  ) : notFound ? (
    <ChatNotFound />
  ) : (
    <ChatUI id={chatId} />
  );
}
