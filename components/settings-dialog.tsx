import { Gear } from '@phosphor-icons/react';

import { useSettings } from '@/hooks/use-settings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsAPIKey } from '@/components/settings-apikey';
import { SettingsModel } from '@/components/settings-model';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { allowCustomAPIKey } = useSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Gear className="mr-2 size-6" />
            Settings
          </DialogTitle>
        </DialogHeader>
        <Separator className="my-1" />
        <Tabs defaultValue="models">
          <TabsList className="w-full">
            <TabsTrigger value="models" className="grow">
              Models
            </TabsTrigger>
            {allowCustomAPIKey && (
              <TabsTrigger value="apikeys" className="grow">
                API Keys
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="models" className="px-px">
            <SettingsModel />
          </TabsContent>
          {allowCustomAPIKey && (
            <TabsContent value="apikeys" className="px-px">
              <SettingsAPIKey />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
