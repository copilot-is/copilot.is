'use client';

import * as React from 'react';
import { Key } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';

import { APIProviders } from '@/lib/constant';
import { useSettings } from '@/hooks/use-settings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink } from '@/components/external-link';

interface SettingsAPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsAPIDialog = ({
  open,
  onOpenChange
}: SettingsAPIDialogProps) => {
  const form = useForm();
  const { apiConfigs, setAPIConfigs } = useSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Key className="mr-2 size-6" />
            API Customization
          </DialogTitle>
          <DialogDescription>
            The api configuration will be saved to your browser&apos;s local
            storage under the name{' '}
            <code className="font-mono font-medium">&apos;configs&apos;</code>.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="openai">
          <TabsList className="flex h-auto w-full flex-wrap">
            <TabsTrigger className="grow" value="openai">
              OpenAI
            </TabsTrigger>
            <TabsTrigger className="grow" value="google">
              Google AI
            </TabsTrigger>
            <TabsTrigger className="grow" value="anthropic">
              Anthropic
            </TabsTrigger>
            <TabsTrigger className="grow" value="azure">
              Azure OpenAI
            </TabsTrigger>
            <TabsTrigger className="grow" value="vertex">
              Google Vertex AI
            </TabsTrigger>
          </TabsList>
          <Form {...form}>
            <TabsContent value="openai" className="px-px">
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>API Provider</FormLabel>
                  <Select
                    onValueChange={(value: string) =>
                      setAPIConfigs(
                        'openai',
                        'provider',
                        value === 'null' ? undefined : value
                      )
                    }
                    value={apiConfigs?.['openai']?.provider || 'null'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider">
                          {
                            APIProviders.find(
                              p =>
                                p.value ===
                                (apiConfigs?.['openai']?.provider || 'null')
                            )?.text
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {APIProviders.filter(p =>
                        ['azure', 'null'].includes(p.value)
                      ).map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Please select the appropriate provider for your OpenAI API.
                  </FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      value={apiConfigs?.['openai']?.token || ''}
                      onChange={e => {
                        setAPIConfigs('openai', 'token', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    If you have not obtained your OpenAI API key, you can do so
                    at{' '}
                    <ExternalLink href="https://platform.openai.com/account/api-keys">
                      OpenAI
                    </ExternalLink>
                    .
                    <ExternalLink href="https://platform.openai.com/account/usage">
                      View Account Usage
                    </ExternalLink>
                  </FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      value={apiConfigs?.['openai']?.baseURL || ''}
                      onChange={e => {
                        setAPIConfigs('openai', 'baseURL', e.target.value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              </div>
            </TabsContent>
            <TabsContent value="google" className="px-px">
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>API Provider</FormLabel>
                  <Select
                    onValueChange={(value: string) =>
                      setAPIConfigs(
                        'google',
                        'provider',
                        value === 'null' ? undefined : value
                      )
                    }
                    value={apiConfigs?.['google']?.provider || 'null'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider">
                          {
                            APIProviders.find(
                              p =>
                                p.value ===
                                (apiConfigs?.['google']?.provider || 'null')
                            )?.text
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {APIProviders.filter(p =>
                        ['vertex', 'null'].includes(p.value)
                      ).map(item => (
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
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      value={apiConfigs?.['google']?.token || ''}
                      onChange={e => {
                        setAPIConfigs('google', 'token', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    If you have not obtained your Google Generative AI API key,
                    you can do so at{' '}
                    <ExternalLink href="https://aistudio.google.com/app/apikey">
                      Google AI Studio
                    </ExternalLink>
                    .
                  </FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      value={apiConfigs?.['google']?.baseURL || ''}
                      onChange={e => {
                        setAPIConfigs('google', 'baseURL', e.target.value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              </div>
            </TabsContent>
            <TabsContent value="anthropic" className="px-px">
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>API Provider</FormLabel>
                  <Select
                    onValueChange={(value: string) =>
                      setAPIConfigs(
                        'anthropic',
                        'provider',
                        value === 'null' ? undefined : value
                      )
                    }
                    value={apiConfigs?.['anthropic']?.provider || 'null'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider">
                          {
                            APIProviders.find(
                              p =>
                                p.value ===
                                (apiConfigs?.['anthropic']?.provider || 'null')
                            )?.text
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {APIProviders.filter(p =>
                        ['vertex', 'null'].includes(p.value)
                      ).map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Please select the appropriate provider for your Anthropic
                    API.
                  </FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      value={apiConfigs?.['anthropic']?.token || ''}
                      onChange={e => {
                        setAPIConfigs('anthropic', 'token', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    If you have not obtained your Anthropic API key, you can do
                    so at{' '}
                    <ExternalLink href="https://console.anthropic.com/settings/keys">
                      Anthropic Console
                    </ExternalLink>
                    .
                  </FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      value={apiConfigs?.['anthropic']?.baseURL || ''}
                      onChange={e => {
                        setAPIConfigs('anthropic', 'baseURL', e.target.value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              </div>
            </TabsContent>
            <TabsContent value="azure" className="px-px">
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      value={apiConfigs?.['azure']?.token || ''}
                      onChange={e => {
                        setAPIConfigs('azure', 'token', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>The Azure API key.</FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>Endpoint</FormLabel>
                  <FormControl>
                    <Input
                      value={apiConfigs?.['azure']?.baseURL || ''}
                      onChange={e => {
                        setAPIConfigs('azure', 'baseURL', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>The Azure endpoint.</FormDescription>
                </FormItem>
              </div>
            </TabsContent>
            <TabsContent value="vertex" className="px-px">
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>Project ID</FormLabel>
                  <FormControl>
                    <Input
                      value={apiConfigs?.['vertex']?.project || ''}
                      onChange={e => {
                        setAPIConfigs('vertex', 'project', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    The Google Cloud project id that you want to use for the API
                    calls.
                  </FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      value={apiConfigs?.['vertex']?.location || ''}
                      onChange={e => {
                        setAPIConfigs('vertex', 'location', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    The Google Cloud location that you want to use for the API
                    calls, e.g. us-central1.
                  </FormDescription>
                </FormItem>
                <FormItem>
                  <FormLabel>JSON Web Tokens</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      value={apiConfigs?.['vertex']?.token || ''}
                      onChange={e => {
                        setAPIConfigs('vertex', 'token', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    The{' '}
                    <ExternalLink href="https://console.cloud.google.com/apis/credentials">
                      Google Cloud Console
                    </ExternalLink>{' '}
                    provides a .json file that you can use to configure a JWT
                    auth Google Vertex AI. <br />
                    The Authentication options provided by{' '}
                    <ExternalLink href="https://github.com/googleapis/google-auth-library-nodejs/">
                      Google Auth Library
                    </ExternalLink>
                    .
                  </FormDescription>
                </FormItem>
              </div>
            </TabsContent>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
