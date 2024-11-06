'use client';

import { useParams } from 'next/navigation';
import { CaretDown } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';

import { DefaultSettings } from '@/lib/constant';
import { isImageModel } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import { useStore } from '@/store/useStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormItem, FormLabel } from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

export const ModelPopover = () => {
  const form = useForm();
  const { chatId } = useParams();
  const { chatDetails, updateChatDetail, updateChat } = useStore();
  const { model, settings, setSettings } = useSettings();

  const chat = chatDetails[chatId?.toString()];
  const chatUsage = { ...{ ...settings, model }, ...chat?.usage };
  const isImage = isImageModel(chatUsage.model || model);

  const handleChange = (key: string, value?: number | null) => {
    if (chat) {
      const usage = {
        ...chatUsage,
        [key]: value
      };
      updateChat(chat.id, { usage });
      updateChatDetail(chat.id, { usage });
    } else {
      setSettings(key, value);
    }
  };

  const handleReset = (key: string) => {
    if (chat) {
      handleChange(key, DefaultSettings[key]);
    } else {
      setSettings(key, null);
    }
  };

  return isImage ? (
    <div className="group flex items-center text-xs font-normal text-muted-foreground">
      <span className="whitespace-nowrap px-px">{chatUsage.model}</span>
    </div>
  ) : (
    <Popover>
      <PopoverTrigger className="group flex items-center text-xs font-normal text-muted-foreground hover:text-accent-foreground data-[state=open]:text-accent-foreground">
        <span className="whitespace-nowrap px-px">{chatUsage.model}</span>
        <CaretDown className="size-3 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
      </PopoverTrigger>
      <PopoverContent className="relative w-80">
        <Form {...form}>
          <div className="space-y-2">
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                <div>System Prompt</div>
                <div className="text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-5 rounded-sm px-2"
                    onClick={() => setSettings('prompt', null)}
                  >
                    Reset
                  </Button>
                </div>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Enter a prompt..."
                  value={chatUsage.prompt ?? ''}
                  onChange={e => {
                    setSettings('prompt', e.target.value);
                  }}
                />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel className="grid grid-cols-3 items-center">
                <div>Temperature</div>
                <div className="text-center">
                  <Badge className="rounded-full">
                    {chatUsage.temperature}
                  </Badge>
                </div>
                <div className="text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-5 rounded-sm px-2"
                    onClick={() => handleReset('temperature')}
                  >
                    Reset
                  </Button>
                </div>
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="w-14 justify-center rounded-full"
                  >
                    0
                  </Badge>
                  <div className="flex-1">
                    <Slider
                      min={0}
                      max={2}
                      step={0.1}
                      value={[chatUsage.temperature]}
                      onValueChange={value =>
                        handleChange('temperature', value[0])
                      }
                    />
                  </div>
                  <Badge
                    variant="secondary"
                    className="w-14 justify-center rounded-full"
                  >
                    2
                  </Badge>
                </div>
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel className="grid grid-cols-3 items-center">
                <div>Max Tokens</div>
                <div className="text-center">
                  <Badge className="rounded-full">{chatUsage.maxTokens}</Badge>
                </div>
                <div className="text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-5 rounded-sm px-2"
                    onClick={() => handleReset('maxTokens')}
                  >
                    Reset
                  </Button>
                </div>
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="w-14 justify-center rounded-full"
                  >
                    1
                  </Badge>
                  <div className="flex-1">
                    <Slider
                      min={1}
                      max={8192}
                      step={1}
                      value={[chatUsage.maxTokens]}
                      onValueChange={value =>
                        handleChange('maxTokens', value[0])
                      }
                    />
                  </div>
                  <Badge
                    variant="secondary"
                    className="w-14 justify-center rounded-full"
                  >
                    8192
                  </Badge>
                </div>
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel className="grid grid-cols-3 items-center">
                <div>Presence Penalty</div>
                <div className="text-center">
                  <Badge className="rounded-full">
                    {chatUsage.presencePenalty}
                  </Badge>
                </div>
                <div className="text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-5 rounded-sm px-2"
                    onClick={() => handleReset('presencePenalty')}
                  >
                    Reset
                  </Button>
                </div>
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="w-14 justify-center rounded-full"
                  >
                    -2
                  </Badge>
                  <div className="flex-1">
                    <Slider
                      min={-2}
                      max={2}
                      step={0.1}
                      value={[chatUsage.presencePenalty]}
                      onValueChange={value =>
                        handleChange('presencePenalty', value[0])
                      }
                    />
                  </div>
                  <Badge
                    variant="secondary"
                    className="w-14 justify-center rounded-full"
                  >
                    2
                  </Badge>
                </div>
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel className="grid grid-cols-3 items-center">
                <div>Frequency Penalty</div>
                <div className="text-center">
                  <Badge className="rounded-full">
                    {chatUsage.frequencyPenalty}
                  </Badge>
                </div>
                <div className="text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-5 rounded-sm px-2"
                    onClick={() => handleReset('frequencyPenalty')}
                  >
                    Reset
                  </Button>
                </div>
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="w-14 justify-center rounded-full"
                  >
                    -2
                  </Badge>
                  <div className="flex-1">
                    <Slider
                      min={-2}
                      max={2}
                      step={0.1}
                      value={[chatUsage.frequencyPenalty]}
                      onValueChange={value =>
                        handleChange('frequencyPenalty', value[0])
                      }
                    />
                  </div>
                  <Badge
                    variant="secondary"
                    className="w-14 justify-center rounded-full"
                  >
                    2
                  </Badge>
                </div>
              </FormControl>
            </FormItem>
          </div>
        </Form>
      </PopoverContent>
    </Popover>
  );
};
