'use client';

import { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Label as UiLabel } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ClearHistoryDialog } from '@/components/clear-history-dialog';
import { SharedLinksDialog } from '@/components/shared-links-dialog';

export const SettingsGeneral = () => {
  const { theme, setTheme } = useTheme();
  const [isSharedLinks, setIsSharedLinks] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const renderThemeIcon = (value: string) => {
    switch (value) {
      case 'system':
        return <Monitor className="size-4" />;
      case 'light':
        return <Sun className="size-4" />;
      case 'dark':
        return <Moon className="size-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-0">
        <UiLabel>Theme</UiLabel>
        <Select onValueChange={value => setTheme(value)} value={theme}>
          <SelectTrigger className="w-auto rounded-full capitalize">
            <SelectValue placeholder="Select a theme">
              {theme && (
                <div className="flex items-center gap-2">
                  {renderThemeIcon(theme)}
                  {theme}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">
              <div className="flex items-center gap-2">
                <Monitor className="size-4" />
                System
              </div>
            </SelectItem>
            <SelectItem value="light">
              <div className="flex items-center gap-2">
                <Sun className="size-4" />
                Light
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center gap-2">
                <Moon className="size-4" />
                Dark
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between space-y-0">
        <UiLabel>Shared links</UiLabel>
        <Button
          className="rounded-full font-normal"
          variant="outline"
          onClick={() => setIsSharedLinks(true)}
        >
          Manage
        </Button>
      </div>
      <div className="flex items-center justify-between space-y-0">
        <UiLabel>Delete all chats</UiLabel>
        <Button
          className="rounded-full"
          variant="destructive"
          onClick={() => setIsHistoryOpen(true)}
        >
          Delete all
        </Button>
      </div>
      <SharedLinksDialog open={isSharedLinks} onOpenChange={setIsSharedLinks} />
      <ClearHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />
    </div>
  );
};
