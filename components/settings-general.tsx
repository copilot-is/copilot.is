'use client';

import { useState } from 'react';
import { Monitor, Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormItem, FormLabel } from '@/components/ui/form';
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
  const form = useForm();
  const { theme, setTheme } = useTheme();
  const [isSharedLinks, setIsSharedLinks] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const renderThemeIcon = (value: string) => {
    switch (value) {
      case 'system':
        return <Monitor className="mr-2 size-4" />;
      case 'light':
        return <Sun className="mr-2 size-4" />;
      case 'dark':
        return <Moon className="mr-2 size-4" />;
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormItem className="flex items-center justify-between space-y-0">
          <FormLabel>Theme</FormLabel>
          <Select onValueChange={value => setTheme(value)} value={theme}>
            <FormControl>
              <SelectTrigger className="w-auto rounded-full capitalize">
                <SelectValue placeholder="Select a theme">
                  {theme && (
                    <div className="flex items-center">
                      {renderThemeIcon(theme)}
                      {theme}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="system">
                <div className="flex items-center">
                  <Monitor className="mr-2 size-4" />
                  System
                </div>
              </SelectItem>
              <SelectItem value="light">
                <div className="flex items-center">
                  <Sun className="mr-2 size-4" />
                  Light
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center">
                  <Moon className="mr-2 size-4" />
                  Dark
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
        <FormItem className="flex items-center justify-between space-y-0">
          <FormLabel>Shared links</FormLabel>
          <Button
            className="rounded-full font-normal"
            variant="outline"
            onClick={() => setIsSharedLinks(true)}
          >
            Manage
          </Button>
        </FormItem>
        <FormItem className="flex items-center justify-between space-y-0">
          <FormLabel>Delete all chats</FormLabel>
          <Button
            className="rounded-full"
            variant="destructive"
            onClick={() => setIsHistoryOpen(true)}
          >
            Delete all
          </Button>
        </FormItem>
        <SharedLinksDialog
          open={isSharedLinks}
          onOpenChange={setIsSharedLinks}
        />
        <ClearHistoryDialog
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
        />
      </div>
    </Form>
  );
};
