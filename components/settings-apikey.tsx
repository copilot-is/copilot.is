'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';

import { useSettings } from '@/hooks/use-settings';
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ExternalLink } from '@/components/external-link';

export const SettingsAPIKey = () => {
  const form = useForm();
  const { token, setToken } = useSettings();

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormItem>
          <FormLabel>OpenAI API key</FormLabel>
          <FormControl>
            <Input
              value={token?.openai || ''}
              onChange={e => {
                setToken('openai', e.target.value);
              }}
            />
          </FormControl>
          <FormDescription>
            If you have not obtained your OpenAI API key, you can do so at{' '}
            <ExternalLink href="https://platform.openai.com/account/api-keys">
              OpenAI
            </ExternalLink>
            . The token will be saved to your browser&apos;s local storage under
            the name <code className="font-mono">ai-token</code>.{' '}
            <ExternalLink href="https://platform.openai.com/account/usage">
              View Account Usage
            </ExternalLink>
          </FormDescription>
        </FormItem>
        <FormItem>
          <FormLabel>Google API key</FormLabel>
          <FormControl>
            <Input
              value={token?.google || ''}
              onChange={e => {
                setToken('google', e.target.value);
              }}
            />
          </FormControl>
          <FormDescription>
            If you have not obtained your Google Generative AI API key, you can
            do so at{' '}
            <ExternalLink href="https://aistudio.google.com/app/apikey">
              Google AI Studio
            </ExternalLink>
            . The token will be saved to your browser&apos;s local storage under
            the name <code className="font-mono">ai-token</code>.
          </FormDescription>
        </FormItem>
        <FormItem>
          <FormLabel>Anthropic API key</FormLabel>
          <FormControl>
            <Input
              value={token?.anthropic || ''}
              onChange={e => {
                setToken('anthropic', e.target.value);
              }}
            />
          </FormControl>
          <FormDescription>
            If you have not obtained your Anthropic API key, you can do so at{' '}
            <ExternalLink href="https://console.anthropic.com/settings/keys">
              Anthropic Console
            </ExternalLink>
            . The token will be saved to your browser&apos;s local storage under
            the name <code className="font-mono">ai-token</code>.
          </FormDescription>
        </FormItem>
      </form>
    </Form>
  );
};
