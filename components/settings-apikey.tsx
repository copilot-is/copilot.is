'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';

import { useSettings } from '@/hooks/use-settings';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ExternalLink } from '@/components/external-link';

type FormValues = {
  openai: string;
  google: string;
  anthropic: string;
};

export const SettingsAPIKey = () => {
  const { token, setToken } = useSettings();
  const form = useForm<FormValues>({
    defaultValues: {
      openai: token?.openai || '',
      google: token?.google || '',
      anthropic: token?.anthropic || ''
    }
  });

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="openai"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OpenAI API key</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={e => {
                    field.onChange(e);
                    setToken('openai', e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                If you have not obtained your OpenAI API key, you can do so at{' '}
                <ExternalLink href="https://platform.openai.com/account/api-keys">
                  OpenAI
                </ExternalLink>
                . The token will be saved to your browser&apos;s local storage
                under the name <code className="font-mono">ai-token</code>.{' '}
                <ExternalLink href="https://platform.openai.com/account/usage">
                  View Account Usage
                </ExternalLink>
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="google"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Google API key</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={e => {
                    field.onChange(e);
                    setToken('google', e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                If you have not obtained your Google API key, you can do so at{' '}
                <ExternalLink href="https://makersuite.google.com/app/apikey">
                  Google AI Studio
                </ExternalLink>
                . The token will be saved to your browser&apos;s local storage
                under the name <code className="font-mono">ai-token</code>.
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="anthropic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anthropic API key</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={e => {
                    field.onChange(e);
                    setToken('anthropic', e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                If you have not obtained your Anthropic API key, you can do so
                at{' '}
                <ExternalLink href="https://console.anthropic.com/settings/keys">
                  Anthropic Console
                </ExternalLink>
                . The token will be saved to your browser&apos;s local storage
                under the name <code className="font-mono">ai-token</code>.
              </FormDescription>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
