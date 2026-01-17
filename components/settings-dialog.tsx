import { Gear, SpeakerHigh, User } from '@phosphor-icons/react';

import { useSettings } from '@/hooks/use-settings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsGeneral } from '@/components/settings-general';
import { SettingsProfile } from '@/components/settings-profile';
import { SettingsSpeech } from '@/components/settings-speech';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { systemSettings } = useSettings();
  const { speechEnabled } = systemSettings;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="ml-3">Settings</DialogTitle>
        </DialogHeader>
        <Tabs
          defaultValue="general"
          orientation="vertical"
          className="flex flex-row gap-5 sm:min-h-64"
        >
          <TabsList className="flex h-full min-w-40 flex-col justify-start gap-2 bg-transparent p-0">
            <TabsTrigger
              value="general"
              className="w-full justify-start text-wrap py-2 shadow-none hover:bg-muted focus-visible:ring-1 focus-visible:ring-offset-1 data-[state=active]:bg-muted data-[state=active]:shadow-none"
            >
              <Gear className="mr-2 size-4" />
              General
            </TabsTrigger>
            {speechEnabled && (
              <TabsTrigger
                value="speech"
                className="w-full justify-start text-wrap py-2 shadow-none hover:bg-muted focus-visible:ring-1 focus-visible:ring-offset-1 data-[state=active]:bg-muted data-[state=active]:shadow-none"
              >
                <SpeakerHigh className="mr-2 size-4" />
                Speech
              </TabsTrigger>
            )}
            <TabsTrigger
              value="profile"
              className="w-full justify-start text-wrap py-2 shadow-none hover:bg-muted focus-visible:ring-1 focus-visible:ring-offset-1 data-[state=active]:bg-muted data-[state=active]:shadow-none"
            >
              <User className="mr-2 size-4" />
              Profile
            </TabsTrigger>
          </TabsList>
          <TabsContent tabIndex={-1} value="general" className="mt-0 w-full">
            <SettingsGeneral />
          </TabsContent>
          {speechEnabled && (
            <TabsContent tabIndex={-1} value="speech" className="mt-0 w-full">
              <SettingsSpeech />
            </TabsContent>
          )}
          <TabsContent tabIndex={-1} value="profile" className="mt-0 w-full">
            <SettingsProfile />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
