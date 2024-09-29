'use client';

import { useState } from 'react';
import { CaretDoubleDown, CaretDoubleUp } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';

import { SupportedModels } from '@/lib/constant';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

export const SettingsModel = () => {
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  const { availableModels, model, setModel, modelSettings, setModelSettings } =
    useSettings();
  const allowedModels = availableModels
    ? SupportedModels.filter(m => availableModels.includes(m.value))
    : SupportedModels;

  const form = useForm({
    defaultValues: {
      model: model,
      prompt: modelSettings.prompt ?? '',
      temperature: modelSettings.temperature,
      presencePenalty: modelSettings.presencePenalty,
      frequencyPenalty: modelSettings.frequencyPenalty,
      topP: modelSettings.topP,
      topK: modelSettings.topK,
      maxTokens: modelSettings.maxTokens
    }
  });

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <Select
                onValueChange={value => {
                  field.onChange(value);
                  setModel(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model">
                      {allowedModels.find(m => m.value === field.value)?.text}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allowedModels.map(model => (
                    <SelectItem key={model.value} value={model.value}>
                      <div>{model.text}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.value}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Prompt</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Enter a prompt..."
                  {...field}
                  onChange={e => {
                    field.onChange(e);
                    setModelSettings('prompt', e.target.value);
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="temperature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temperature: {field.value}</FormLabel>
              <FormControl>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[field.value]}
                  onValueChange={value => {
                    field.onChange(value[0]);
                    setModelSettings('temperature', value[0]);
                  }}
                />
              </FormControl>
              <FormDescription className="flex justify-between">
                <span>Precise</span>
                <span>Neutral</span>
                <span>Creative</span>
              </FormDescription>
            </FormItem>
          )}
        />

        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-full rounded-full"
                onClick={() => setShowMoreSettings(!showMoreSettings)}
              >
                {showMoreSettings ? (
                  <CaretDoubleUp className="size-4" />
                ) : (
                  <CaretDoubleDown className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showMoreSettings ? '隐藏更多设置' : '显示更多设置'}
            </TooltipContent>
          </Tooltip>
        </div>

        {showMoreSettings && (
          <>
            <FormField
              control={form.control}
              name="presencePenalty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Presence Penalty: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={-2}
                      max={2}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={value => {
                        field.onChange(value[0]);
                        setModelSettings('presencePenalty', value[0]);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequencyPenalty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency Penalty: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={-2}
                      max={2}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={value => {
                        field.onChange(value[0]);
                        setModelSettings('frequencyPenalty', value[0]);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top P: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={value => {
                        field.onChange(value[0]);
                        setModelSettings('topP', value[0]);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topK"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top K: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[field.value]}
                      onValueChange={value => {
                        field.onChange(value[0]);
                        setModelSettings('topK', value[0]);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxTokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Tokens: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={4096}
                      step={1}
                      value={[field.value]}
                      onValueChange={value => {
                        field.onChange(value[0]);
                        setModelSettings('maxTokens', value[0]);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </form>
    </Form>
  );
};
