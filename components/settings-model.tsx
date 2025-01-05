'use client';

import { useForm } from 'react-hook-form';

import { useSettings } from '@/hooks/use-settings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormItem, FormLabel } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ModelIcon } from '@/components/model-icon';

export const SettingsModel = () => {
  const form = useForm();
  const { availableModels, model, setModel, settings, setSettings } =
    useSettings();
  const selectedModel = availableModels.find(m => m.value === model);

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormItem>
          <FormLabel>Model</FormLabel>
          <Select onValueChange={setModel} value={model}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a model">
                  <div className="flex items-center">
                    <ModelIcon provider={selectedModel?.provider} />
                    <span className="ml-2 font-medium">
                      {selectedModel?.text}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableModels.length > 0 ? (
                availableModels.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex items-center">
                      <ModelIcon provider={model.provider} />
                      <div className="ml-2">
                        <div className="font-medium">{model.text}</div>
                        <div className="text-xs text-muted-foreground">
                          {model.value}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="py-1 text-center text-sm text-muted-foreground">
                  No available models
                </div>
              )}
            </SelectContent>
          </Select>
        </FormItem>
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
              rows={3}
              placeholder="Enter a prompt..."
              value={settings.prompt ?? ''}
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
              <Badge className="rounded-full">{settings.temperature}</Badge>
            </div>
            <div className="text-right">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-5 rounded-sm px-2"
                onClick={() => setSettings('temperature', null)}
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
                  value={[settings.temperature]}
                  onValueChange={value => {
                    setSettings('temperature', value[0]);
                  }}
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
              <Badge className="rounded-full">{settings.maxTokens}</Badge>
            </div>
            <div className="text-right">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-5 rounded-sm px-2"
                onClick={() => setSettings('maxTokens', null)}
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
                  value={[settings.maxTokens]}
                  onValueChange={value => {
                    setSettings('maxTokens', value[0]);
                  }}
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
              <Badge className="rounded-full">{settings.presencePenalty}</Badge>
            </div>
            <div className="text-right">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-5 rounded-sm px-2"
                onClick={() => setSettings('presencePenalty', null)}
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
                  value={[settings.presencePenalty]}
                  onValueChange={value => {
                    setSettings('presencePenalty', value[0]);
                  }}
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
                {settings.frequencyPenalty}
              </Badge>
            </div>
            <div className="text-right">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-5 rounded-sm px-2"
                onClick={() => setSettings('frequencyPenalty', null)}
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
                  value={[settings.frequencyPenalty]}
                  onValueChange={value => {
                    setSettings('frequencyPenalty', value[0]);
                  }}
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
  );
};
