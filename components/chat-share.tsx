'use client';

import * as React from 'react';

import { type Chat } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { IconShare } from '@/components/ui/icons';
import { ChatShareDialog } from '@/components/chat-share-dialog';

interface ChatShareProps {
  chat?: Chat;
}

export function ChatShare({ chat }: ChatShareProps) {
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);

  if (!chat) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        className="bg-background px-3"
        onClick={() => setShareDialogOpen(true)}
      >
        <IconShare className="mr-1" />
        Share
      </Button>
      <ChatShareDialog
        chat={chat}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
    </>
  );
}
