'use client'

import * as React from 'react'

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconSettings } from '@/components/ui/icons'
import { Tooltip } from '@/components/ui/tooltip'
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ExternalLink } from '@/components/external-link'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tab'
import { SupportedModels } from '@/lib/constant'
import { useSettings } from '@/lib/hooks/use-settings'

export const Settings = () => {
  const [open, setOpen] = React.useState(false)
  const {
    allowCustomAPIKey,
    availableModels,
    model,
    setModel,
    token,
    setToken,
    modelSettings,
    setModelSettings
  } = useSettings()
  const allowedModels = availableModels
    ? SupportedModels.filter(m => availableModels.includes(m.value))
    : SupportedModels
  const selectedModel = allowedModels.find(m => m.value === model)?.text

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip content="Settings">
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="hover:bg-background">
            <IconSettings className="size-5" />
          </Button>
        </DialogTrigger>
      </Tooltip>
      <DialogContent>
        <Tabs>
          <TabsList>
            <TabsTrigger value="model">Model Settings</TabsTrigger>
            {allowCustomAPIKey && (
              <TabsTrigger value="apiKey">API Key</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="model" className="grid gap-4">
            <fieldset>
              <label className="mb-1.5 block text-sm font-bold">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>{selectedModel}</SelectTrigger>
                <SelectContent>
                  {allowedModels.map(model => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </fieldset>
            <fieldset>
              <label
                className="mb-1.5 block text-sm font-bold"
                htmlFor="prompt"
              >
                System Prompt
                <span className="text-muted-foreground ml-1.5 text-sm">
                  (GPT Only)
                </span>
                <Button
                  variant="link"
                  size="xs"
                  className="text-sm"
                  onClick={() => setModelSettings('prompt', null)}
                >
                  Reset to default
                </Button>
              </label>
              <Textarea
                id="prompt"
                placeholder='Enter a prompt or type "/" to select a prompt...'
                value={modelSettings.prompt ?? ''}
                onChange={e => setModelSettings('prompt', e.target.value)}
              />
            </fieldset>
            <fieldset>
              <label className="mb-1.5 block text-sm font-bold">
                Temperature:
                <span className="text-muted-foreground ml-1.5 text-sm">
                  {modelSettings.temperature}
                </span>
                <Button
                  variant="link"
                  size="xs"
                  className="text-sm"
                  onClick={() => setModelSettings('temperature', null)}
                >
                  Reset to default
                </Button>
              </label>
              <Slider
                value={[modelSettings.temperature]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={value =>
                  setModelSettings('temperature', value[0])
                }
              />
              <div className="flex justify-between">
                <div className="flex justify-center">Precise</div>
                <div className="flex justify-center">Neutral</div>
                <div className="flex justify-center">Creative</div>
              </div>
            </fieldset>
            <fieldset>
              <label className="mb-1.5 block text-sm font-bold">
                Presence Penalty:
                <span className="text-muted-foreground ml-1.5 text-sm">
                  {modelSettings.presencePenalty}
                </span>
                <Button
                  variant="link"
                  size="xs"
                  className="text-sm"
                  onClick={() => setModelSettings('presencePenalty', null)}
                >
                  Reset to default
                </Button>
              </label>
              <Slider
                value={[modelSettings.presencePenalty]}
                min={-2}
                max={2}
                step={0.1}
                onValueChange={value =>
                  setModelSettings('presencePenalty', value[0])
                }
              />
            </fieldset>
            <fieldset>
              <label className="mb-1.5 block text-sm font-bold">
                Frequency Penalty:
                <span className="text-muted-foreground ml-1.5 text-sm">
                  {modelSettings.frequencyPenalty}
                </span>
                <Button
                  variant="link"
                  size="xs"
                  className="text-sm"
                  onClick={() => setModelSettings('frequencyPenalty', null)}
                >
                  Reset to default
                </Button>
              </label>
              <Slider
                value={[modelSettings.frequencyPenalty]}
                min={-2}
                max={2}
                step={0.1}
                onValueChange={value =>
                  setModelSettings('frequencyPenalty', value[0])
                }
              />
            </fieldset>
            <fieldset>
              <label className="mb-1.5 block text-sm font-bold">
                Top P:
                <span className="text-muted-foreground ml-1.5 text-sm">
                  {modelSettings.topP}
                </span>
                <Button
                  variant="link"
                  size="xs"
                  className="text-sm"
                  onClick={() => setModelSettings('topP', null)}
                >
                  Reset to default
                </Button>
              </label>
              <Slider
                value={[modelSettings.topP]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={value => setModelSettings('topP', value[0])}
              />
            </fieldset>
            <fieldset>
              <label className="mb-1.5 block text-sm font-bold">
                Top K:
                <span className="text-muted-foreground ml-1.5 text-sm">
                  {modelSettings.topK}
                </span>
                <Button
                  variant="link"
                  size="xs"
                  className="text-sm"
                  onClick={() => setModelSettings('topK', null)}
                >
                  Reset to default
                </Button>
              </label>
              <Slider
                value={[modelSettings.topK]}
                min={0}
                max={50}
                step={1}
                onValueChange={value => setModelSettings('topK', value[0])}
              />
            </fieldset>
            <fieldset>
              <label className="mb-1.5 block text-sm font-bold">
                Max Tokens:
                <span className="text-muted-foreground ml-1.5 text-sm">
                  {modelSettings.maxTokens}
                </span>
                <Button
                  variant="link"
                  size="xs"
                  className="text-sm"
                  onClick={() => setModelSettings('maxTokens', null)}
                >
                  Reset to default
                </Button>
              </label>
              <Slider
                value={[modelSettings.maxTokens]}
                min={1024}
                max={512000}
                step={1}
                onValueChange={value => setModelSettings('maxTokens', value[0])}
              />
            </fieldset>
          </TabsContent>
          <TabsContent value="apiKey" className="grid gap-4">
            {allowCustomAPIKey && (
              <>
                <fieldset>
                  <label
                    className="mb-1.5 block text-sm font-bold"
                    htmlFor="openai"
                  >
                    OpenAI API key
                  </label>
                  <Input
                    id="openai"
                    value={token?.openai ?? ''}
                    onChange={e => setToken('openai', e.target.value)}
                  />
                  <p className="text-muted-foreground mt-1 text-sm">
                    If you have not obtained your OpenAI API key, you can do so
                    at{' '}
                    <ExternalLink href="https://platform.openai.com/account/api-keys">
                      OpenAI
                    </ExternalLink>
                    . The token will be saved to your browser&apos;s local
                    storage under the name{' '}
                    <code className="font-mono">ai-token</code>.{' '}
                    <ExternalLink href="https://platform.openai.com/account/usage">
                      View Account Usage
                    </ExternalLink>
                  </p>
                </fieldset>
                <fieldset>
                  <label
                    className="mb-1.5 block text-sm font-bold"
                    htmlFor="google"
                  >
                    Google API key
                  </label>
                  <Input
                    id="google"
                    value={token?.google ?? ''}
                    onChange={e => setToken('google', e.target.value)}
                  />
                  <p className="text-muted-foreground mt-1 text-sm">
                    If you have not obtained your Google API key, you can do so
                    at{' '}
                    <ExternalLink href="https://makersuite.google.com/app/apikey">
                      Google AI Studio
                    </ExternalLink>
                    . The token will be saved to your browser&apos;s local
                    storage under the name{' '}
                    <code className="font-mono">ai-token</code>.
                  </p>
                </fieldset>
                <fieldset>
                  <label
                    className="mb-1.5 block text-sm font-bold"
                    htmlFor="anthropic"
                  >
                    Anthropic API key
                  </label>
                  <Input
                    id="anthropic"
                    value={token?.anthropic ?? ''}
                    onChange={e => setToken('anthropic', e.target.value)}
                  />
                  <p className="text-muted-foreground mt-1 text-sm">
                    If you have not obtained your Anthropic API key, you can do
                    so at{' '}
                    <ExternalLink href="https://console.anthropic.com/settings/keys">
                      Anthropic Console
                    </ExternalLink>
                    . The token will be saved to your browser&apos;s local
                    storage under the name{' '}
                    <code className="font-mono">ai-token</code>.
                  </p>
                </fieldset>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
