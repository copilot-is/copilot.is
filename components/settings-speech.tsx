'use client';

import { useForm } from 'react-hook-form';

import { TTSModels, Voices } from '@/lib/constant';
import { useSettings } from '@/hooks/use-settings';
import { Form, FormControl, FormItem, FormLabel } from '@/components/ui/form';
import { IconClaudeAI, IconGoogleAI, IconOpenAI } from '@/components/ui/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export const SettingsSpeech = () => {
  const form = useForm();
  const { tts, setTextToSpeech } = useSettings();
  const selectedModel = TTSModels.find(m => m.value === tts.model);

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormItem>
          <FormLabel>Model</FormLabel>
          <Select
            onValueChange={value => setTextToSpeech('model', value)}
            value={tts.model}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a model">
                  <div className="flex items-center">
                    {selectedModel?.provider === 'openai' && <IconOpenAI />}
                    {selectedModel?.provider === 'google' && <IconGoogleAI />}
                    {selectedModel?.provider === 'anthropic' && (
                      <IconClaudeAI />
                    )}
                    <span className="ml-2 font-medium">
                      {selectedModel?.text}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {TTSModels.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center">
                    {model.provider === 'openai' && <IconOpenAI />}
                    {model.provider === 'google' && <IconGoogleAI />}
                    {model.provider === 'anthropic' && <IconClaudeAI />}
                    <div className="ml-2">
                      <div className="font-medium">{model.text}</div>
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
        <FormItem>
          <FormLabel>Voice</FormLabel>
          <Select
            onValueChange={value => setTextToSpeech('voice', value)}
            value={tts.voice}
          >
            <FormControl>
              <SelectTrigger className="capitalize">
                <SelectValue placeholder="Select a voice">
                  {tts.voice}
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
