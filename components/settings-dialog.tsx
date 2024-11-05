import { Gear } from '@phosphor-icons/react';

import { useSettings } from '@/hooks/use-settings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsModel } from '@/components/settings-model';
import { SettingsSpeech } from '@/components/settings-speech';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { tts } = useSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Gear className="mr-2 size-6" />
            Settings
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="models">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="models">Models</TabsTrigger>
            {tts.enabled && <TabsTrigger value="speech">Speech</TabsTrigger>}
          </TabsList>
          <TabsContent value="models" className="px-px">
            <SettingsModel />
          </TabsContent>
          {tts.enabled && (
            <TabsContent value="speech" className="px-px">
              <SettingsSpeech />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
