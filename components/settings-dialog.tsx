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
        <Tabs defaultValue="models" className="flex">
          <TabsList className="flex h-full w-36 flex-col justify-start rounded-none border-none bg-transparent">
            <TabsTrigger
              value="models"
              className="mb-2 w-full justify-start px-4 py-2 font-normal transition-colors hover:bg-slate-300/60 data-[state=active]:bg-slate-200 data-[state=active]:font-medium dark:hover:bg-slate-600/10 dark:data-[state=active]:bg-slate-800"
            >
              Models
            </TabsTrigger>
            {allowCustomAPIKey && (
              <TabsTrigger
                value="apikeys"
                className="mb-2 w-full justify-start px-4 py-2 font-normal transition-colors hover:bg-slate-300/60 data-[state=active]:bg-slate-200 data-[state=active]:font-medium dark:hover:bg-slate-600/10 dark:data-[state=active]:bg-slate-800"
              >
                API Keys
              </TabsTrigger>
            )}
          </TabsList>
          <div className="ml-2 flex-1 px-1">
            <TabsContent value="models" className="mt-0 px-2">
              <SettingsModel />
            </TabsContent>
            {allowCustomAPIKey && (
              <TabsContent value="apikeys" className="mt-0 px-2">
                <SettingsAPIKey />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
