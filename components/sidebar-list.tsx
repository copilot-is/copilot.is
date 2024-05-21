'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { ChatCategories } from '@/lib/constant';
import { Chat, ChatCategory } from '@/lib/types';
import { SidebarActions } from '@/components/sidebar-actions';
import { SidebarItem } from '@/components/sidebar-item';

export interface SidebarListProps {
  chats?: Chat[];
}

export function SidebarList({ chats }: SidebarListProps) {
  const getSortedChats = (data: Chat[], category: ChatCategory) => {
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

    return data
      .filter((chat: Chat) => {
        const chatDate = chat.createdAt;
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
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  return (
    <div className="flex-1 overflow-auto">
      {chats?.length ? (
        <div className="space-y-2 px-3">
          <AnimatePresence>
            {ChatCategories.map(category => {
              const sortedChats = getSortedChats(chats, category);
              return (
                sortedChats.length && (
                  <React.Fragment key={category}>
                    <h2 className="px-2 text-xs text-muted-foreground">
                      {category}
                    </h2>
                    {sortedChats.map(
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
                  </React.Fragment>
                )
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No chat history</p>
        </div>
      )}
    </div>
  );
}
