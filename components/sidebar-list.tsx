'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { compareDesc, isToday, isYesterday, subDays } from 'date-fns';

import { Chat } from '@/types';
import { Categories } from '@/lib/constant';
import { useChatsInfinite } from '@/hooks/use-chats';
import { SidebarItem } from '@/components/sidebar-item';

export function SidebarList() {
  const listRef = useRef<HTMLDivElement>(null);
  const { chats, isLoading, isValidating, setSize, size, hasMore } =
    useChatsInfinite();

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || isLoading || isValidating || !hasMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      setSize(size + 1);
    }
  }, [isLoading, isValidating, hasMore, setSize, size]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const getSortedChats = (list: Chat[], category: string) => {
    const now = new Date();
    const oneWeekAgo = subDays(now, 7);
    const oneMonthAgo = subDays(now, 30);

    return list
      .filter((chat: Chat) => {
        const chatDate = new Date(chat.createdAt);
        switch (category) {
          case 'today':
            return isToday(chatDate);
          case 'yesterday':
            return isYesterday(chatDate);
          case 'lastWeek':
            return (
              !isToday(chatDate) &&
              !isYesterday(chatDate) &&
              chatDate > oneWeekAgo
            );
          case 'lastMonth':
            return chatDate < oneWeekAgo && chatDate >= oneMonthAgo;
          case 'older':
            return chatDate < oneMonthAgo;
        }
      })
      .sort((a, b) =>
        compareDesc(new Date(a.createdAt), new Date(b.createdAt))
      );
  };

  return (
    <div className="flex-1 overflow-auto" ref={listRef}>
      {isLoading && chats.length === 0 && (
        <div className="flex size-full items-center justify-center">
          <CircleNotch className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && chats.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No chat history</p>
        </div>
      )}
      {!isLoading && chats.length > 0 && (
        <div className="space-y-2 px-3">
          {Categories.map((category, index) => {
            const groupedChats = getSortedChats(chats, category.value);
            return (
              groupedChats.length > 0 && (
                <Fragment key={index}>
                  <h2 className="px-3 text-xs text-muted-foreground">
                    {category.text}
                  </h2>
                  {groupedChats.map(
                    (chat, index) =>
                      chat && <SidebarItem key={index} chat={chat} />
                  )}
                </Fragment>
              )
            );
          })}
          {isValidating && hasMore && (
            <div className="flex justify-center py-2">
              <CircleNotch className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
