'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';

import { APIProviders } from '@/lib/constant';
import { useSettings } from '@/hooks/use-settings';
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ExternalLink } from '@/components/external-link';

export const SettingsAPIKey = () => {
  const form = useForm();
  const { apiToken, setAPIToken, apiProvider, setAPIProvider } = useSettings();

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormItem>
          <FormLabel>OpenAI API Key</FormLabel>
          <FormControl>
            <Input
              value={apiToken?.openai || ''}
              onChange={e => {
                setAPIToken('openai', e.target.value);
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
          <FormLabel>Google API Key</FormLabel>
          <FormControl>
            <Input
              value={apiToken?.google || ''}
              onChange={e => {
                setAPIToken('google', e.target.value);
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
          <FormLabel>Google API Provider</FormLabel>
          <Select
            onValueChange={(value: string) =>
              setAPIProvider('google', value === 'null' ? undefined : value)
            }
            value={apiProvider?.google || 'null'}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider">
                  {
                    APIProviders.find(
                      p => p.value === (apiProvider?.google || 'null')
                    )?.text
                  }
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {APIProviders.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {item.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Please select the appropriate provider for your Google API.
          </FormDescription>
        </FormItem>
        <FormItem>
          <FormLabel>Anthropic API Key</FormLabel>
          <FormControl>
            <Input
              value={apiToken?.anthropic || ''}
              onChange={e => {
                setAPIToken('anthropic', e.target.value);
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
        <FormItem>
          <FormLabel>Anthropic API Provider</FormLabel>
          <Select
            onValueChange={(value: string) =>
              setAPIProvider('anthropic', value === 'null' ? undefined : value)
            }
            value={apiProvider?.anthropic || 'null'}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider">
                  {
                    APIProviders.find(
                      p => p.value === (apiProvider?.anthropic || 'null')
                    )?.text
                  }
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {APIProviders.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {item.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Please select the appropriate provider for your Anthropic API.
          </FormDescription>
        </FormItem>
      </form>
    </Form>
  );
};
