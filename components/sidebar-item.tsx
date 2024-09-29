'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';

import { type Chat } from '@/lib/types';
import { cn, providerFromModel } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { buttonVariants } from '@/components/ui/button';
import { IconClaudeAI, IconGoogleAI, IconOpenAI } from '@/components/ui/icons';

interface SidebarItemProps {
  index: number;
  chat: Chat;
  children: React.ReactNode;
}

export function SidebarItem({ index, chat, children }: SidebarItemProps) {
  const { chatId } = useParams();
  const { newChatId, setNewChatId } = useStore();
  const isActive = chatId === chat.id;
  const shouldAnimate = index === 0 && isActive && newChatId === chat.id;
  const provider = providerFromModel(chat.usage.model);

  return (
    <motion.div
      className="relative mt-2 flex items-center"
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
      <div className="absolute left-1 flex size-6 items-center justify-center rounded-full border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
        {provider === 'openai' && <IconOpenAI className="size-4" />}
        {provider === 'google' && <IconGoogleAI className="size-4" />}
        {provider === 'anthropic' && <IconClaudeAI className="size-4" />}
      </div>
      <Link
        href={`/chat/${chat.id}`}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'w-full pl-8 pr-10 font-normal transition-colors hover:bg-slate-300/60 dark:hover:bg-slate-600/10',
          isActive ? 'bg-slate-200 font-medium dark:bg-slate-800' : ''
        )}
      >
        <div className="relative flex-1 truncate break-all">
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
                    setNewChatId();
                  }
                }}
              >
                {character}
              </motion.span>
            ))
          ) : (
            <span>{chat.title}</span>
          )}
        </div>
      </Link>
      <div className="absolute right-1 flex items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
}
