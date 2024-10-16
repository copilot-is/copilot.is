'use client';

import { useForm } from 'react-hook-form';

import { useSettings } from '@/hooks/use-settings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormItem, FormLabel } from '@/components/ui/form';
import { IconClaudeAI, IconGoogleAI, IconOpenAI } from '@/components/ui/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

export const SettingsModel = () => {
  const form = useForm();
  const { availableModels, model, setModel, modelSettings, setModelSettings } =
    useSettings();
  const selectedModel = availableModels.find(m => m.value === model);

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormItem>
          <FormLabel>Model</FormLabel>
          <Select onValueChange={setModel} value={model}>
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
              {availableModels.map(model => (
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
          <FormLabel>System Prompt</FormLabel>
          <FormControl>
            <Textarea
              rows={3}
              placeholder="Enter a prompt..."
              value={modelSettings.prompt ?? ''}
              onChange={e => {
                setModelSettings('prompt', e.target.value);
              }}
            />
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel className="grid grid-cols-3 items-center">
            <div>Temperature</div>
            <div className="text-center">
              <Badge className="rounded-full">
                {modelSettings.temperature}
              </Badge>
            </div>
            <div className="text-right">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-5 rounded-sm px-2"
                onClick={() => setModelSettings('temperature', null)}
              >
                Reset to default
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
                  value={[modelSettings.temperature]}
                  onValueChange={value => {
                    setModelSettings('temperature', value[0]);
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
              <Badge className="rounded-full">{modelSettings.maxTokens}</Badge>
            </div>
            <div className="text-right">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-5 rounded-sm px-2"
                onClick={() => setModelSettings('maxTokens', null)}
              >
                Reset to default
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
                  value={[modelSettings.maxTokens]}
                  onValueChange={value => {
                    setModelSettings('maxTokens', value[0]);
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
              <Badge className="rounded-full">
                {modelSettings.presencePenalty}
              </Badge>
            </div>
            <div className="text-right">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-5 rounded-sm px-2"
                onClick={() => setModelSettings('presencePenalty', null)}
              >
                Reset to default
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
                  value={[modelSettings.presencePenalty]}
                  onValueChange={value => {
                    setModelSettings('presencePenalty', value[0]);
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
                {modelSettings.frequencyPenalty}
              </Badge>
            </div>
            <div className="text-right">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-5 rounded-sm px-2"
                onClick={() => setModelSettings('frequencyPenalty', null)}
              >
                Reset to default
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
                  value={[modelSettings.frequencyPenalty]}
                  onValueChange={value => {
                    setModelSettings('frequencyPenalty', value[0]);
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
      </form>
    </Form>
  );
};
