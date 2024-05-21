'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';

import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { type Chat } from '@/lib/types';
import { cn, providerFromModel } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconClaudeAI, IconGoogleAI, IconOpenAI } from '@/components/ui/icons';

interface SidebarItemProps {
  index: number;
  chat: Chat;
  children: React.ReactNode;
}

export function SidebarItem({ index, chat, children }: SidebarItemProps) {
  const { id } = useParams();
  const [newChatId, setNewChatId] = useLocalStorage<string>('new-chat-id');
  const isActive = id === chat.id;
  const shouldAnimate = index === 0 && isActive && newChatId === chat.id;
  const provider = providerFromModel(chat.usage.model);

  return (
    <motion.div
      className="relative h-8"
      variants={{
        initial: {
          height: 0,
          opacity: 0
        },
        animate: {
          height: 'auto',
          opacity: 1
        }
      }}
      initial={shouldAnimate ? 'initial' : undefined}
      animate={shouldAnimate ? 'animate' : undefined}
      transition={{
        duration: 0.25,
        ease: 'easeIn'
      }}
    >
      <div className="absolute left-1 top-1 flex size-6 items-center justify-center">
        {provider === 'openai' && <IconOpenAI />}
        {provider === 'google' && <IconGoogleAI />}
        {provider === 'anthropic' && <IconClaudeAI />}
      </div>
      <Link
        href={`/chat/${chat.id}`}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'w-full pl-8 pr-10 transition-colors hover:bg-zinc-200/40 dark:hover:bg-zinc-300/10',
          isActive && 'bg-zinc-200 font-semibold dark:bg-zinc-800'
        )}
      >
        <div
          className="relative max-h-5 flex-1 select-none overflow-hidden text-ellipsis break-all"
          title={chat.title}
        >
          <span className="whitespace-nowrap">
            {shouldAnimate ? (
              chat.title.split('').map((character, index) => (
                <motion.span
                  key={index}
                  variants={{
                    initial: {
                      opacity: 0,
                      x: -100
                    },
                    animate: {
                      opacity: 1,
                      x: 0
                    }
                  }}
                  initial={shouldAnimate ? 'initial' : undefined}
                  animate={shouldAnimate ? 'animate' : undefined}
                  transition={{
                    duration: 0.25,
                    ease: 'easeIn',
                    delay: index * 0.05,
                    staggerChildren: 0.05
                  }}
                  onAnimationComplete={() => {
                    if (index === chat.title.length - 1) {
                      setNewChatId('');
                    }
                  }}
                >
                  {character}
                </motion.span>
              ))
            ) : (
              <span>{chat.title}</span>
            )}
          </span>
        </div>
      </Link>
      <div className="absolute right-1 top-1">{children}</div>
    </motion.div>
  );
}
