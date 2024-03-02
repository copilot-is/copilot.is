'use client'

import { Chat } from '@/lib/types'
import { AnimatePresence, motion } from 'framer-motion'

import { SidebarActions } from '@/components/sidebar-actions'
import { SidebarItem } from '@/components/sidebar-item'

export interface SidebarListProps {
  chats?: Chat[]
}

export function SidebarList({ chats }: SidebarListProps) {
  return (
    <div className="flex-1 overflow-auto">
      {chats?.length ? (
        <div className="space-y-2 px-3">
          <AnimatePresence>
            {chats.map(
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
          </AnimatePresence>
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No chat history</p>
        </div>
      )}
    </div>
  )
}
