'use client';

import { useForm } from 'react-hook-form';

import { TTSModels, Voices } from '@/lib/constant';
import { useSettings } from '@/hooks/use-settings';
import { Form, FormControl, FormItem, FormLabel } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ProviderIcon } from '@/components/provider-icon';

export const SettingsSpeech = () => {
  const form = useForm();
  const { userSettings, setUserSettings } = useSettings();
  const { speechModel, speechVoice } = userSettings;
  const selectedModel = TTSModels.find(m => m.value === speechModel);

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormItem className="flex items-center justify-between space-y-0">
          <FormLabel>Model</FormLabel>
          <Select
            onValueChange={value => setUserSettings('speechModel', value)}
            value={speechModel}
          >
            <FormControl>
              <SelectTrigger className="w-auto rounded-full">
                <SelectValue placeholder="Select a model">
                  <div className="flex items-center">
                    <ProviderIcon provider={selectedModel?.provider} />
                    <span className="ml-2">{selectedModel?.text}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {TTSModels.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center">
                    <ProviderIcon provider={model.provider} />
                    <div className="ml-2">
                      <div>{model.text}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.value}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
        <FormItem className="flex items-center justify-between space-y-0">
          <FormLabel>Voice</FormLabel>
          <Select
            onValueChange={value => setUserSettings('speechVoice', value)}
            value={speechVoice}
          >
            <FormControl>
              <SelectTrigger className="w-auto rounded-full capitalize">
                <SelectValue placeholder="Select a voice">
                  {speechVoice}
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Voices.map(voice => (
                <SelectItem className="capitalize" key={voice} value={voice}>
                  {voice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      </div>
    </Form>
  );
};
