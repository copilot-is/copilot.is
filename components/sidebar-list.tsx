'use client';

import { Fragment, useEffect, useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

import { api } from '@/lib/api';
import { ChatCategories } from '@/lib/constant';
import { Chat, ChatCategory } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { SidebarActions } from '@/components/sidebar-actions';
import { SidebarItem } from '@/components/sidebar-item';

export function SidebarList() {
  const { chats, setChats } = useStore();
  const [isLoading, setLoading] = useState(true);
  const chatEntries = Object.values(chats);

  useEffect(() => {
    const fetchData = async () => {
      const result = await api.getChats();
      if (result && !('error' in result)) {
        setChats(result);
      }
      setLoading(false);
    };

    fetchData();
  }, [setChats]);

  const getSortedChats = (list: Chat[], category: ChatCategory) => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(
      new Date().setDate(todayStart.getDate() - 1)
    );
    const oneWeekAgoStart = new Date(
      new Date().setDate(todayStart.getDate() - 7)
    );
    const oneMonthAgoStart = new Date(
      new Date().setMonth(todayStart.getMonth() - 1)
    );

    return list
      .filter((chat: Chat) => {
        const chatDate = new Date(chat.createdAt);
        switch (category) {
          case 'Today':
            return chatDate >= todayStart;
          case 'Yesterday':
            return chatDate >= yesterdayStart && chatDate < todayStart;
          case 'Previous 7 Days':
            return chatDate >= oneWeekAgoStart && chatDate < yesterdayStart;
          case 'Previous Month':
            return chatDate >= oneMonthAgoStart && chatDate < oneWeekAgoStart;
          case 'Older':
            return chatDate < oneMonthAgoStart;
          default:
            return true;
        }
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  };

  return (
    <div className="flex-1 overflow-auto">
      {isLoading && (
        <div className="flex size-full items-center justify-center">
          <CircleNotch className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && chatEntries.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No chat history</p>
        </div>
      )}
      {!isLoading && chatEntries.length > 0 && (
        <div className="space-y-2 px-3">
          <AnimatePresence>
            {ChatCategories.map(category => {
              const categoryChats = getSortedChats(chatEntries, category);
              return (
                categoryChats.length && (
                  <Fragment key={category}>
                    <h2 className="px-3 text-xs text-muted-foreground">
                      {category}
                    </h2>
                    {categoryChats.map(
                      (chat, index) =>
                        chat && (
                          <motion.div
                            key={chat?.id}
                            exit={{
                              opacity: 0,
                              height: 0
                            }}
                          >
                            <SidebarItem index={index} chat={chat}>
                              <SidebarActions chat={chat} />
                            </SidebarItem>
                          </motion.div>
                        )
                    )}
                  </Fragment>
                )
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
