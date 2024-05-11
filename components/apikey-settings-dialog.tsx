'use client'

import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconKey } from '@/components/ui/icons'
import { Tooltip } from '@/components/ui/tooltip'
import { ExternalLink } from '@/components/external-link'
import { useSettings } from '@/lib/hooks/use-settings'

export const APIKeySettingsDialog = () => {
  const [open, setOpen] = React.useState(false)
  const { allowCustomAPIKey, token, setToken } = useSettings()

  return (
    allowCustomAPIKey && (
      <Dialog open={open} onOpenChange={setOpen}>
        <Tooltip content="API Key">
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-background">
              <IconKey className="size-5" />
            </Button>
          </DialogTrigger>
        </Tooltip>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key</DialogTitle>
            <DialogDescription>Model API Key Settings</DialogDescription>
          </DialogHeader>
          <fieldset>
            <label
              className="mb-1.5 block text-sm font-semibold"
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
              If you have not obtained your OpenAI API key, you can do so at{' '}
              <ExternalLink href="https://platform.openai.com/account/api-keys">
                OpenAI
              </ExternalLink>
              . The token will be saved to your browser&apos;s local storage
              under the name <code className="font-mono">ai-token</code>.{' '}
              <ExternalLink href="https://platform.openai.com/account/usage">
                View Account Usage
              </ExternalLink>
            </p>
          </fieldset>
          <fieldset>
            <label
              className="mb-1.5 block text-sm font-semibold"
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
              If you have not obtained your Google API key, you can do so at{' '}
              <ExternalLink href="https://makersuite.google.com/app/apikey">
                Google AI Studio
              </ExternalLink>
              . The token will be saved to your browser&apos;s local storage
              under the name <code className="font-mono">ai-token</code>.
            </p>
          </fieldset>
          <fieldset>
            <label
              className="mb-1.5 block text-sm font-semibold"
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
              If you have not obtained your Anthropic API key, you can do so at{' '}
              <ExternalLink href="https://console.anthropic.com/settings/keys">
                Anthropic Console
              </ExternalLink>
              . The token will be saved to your browser&apos;s local storage
              under the name <code className="font-mono">ai-token</code>.
            </p>
          </fieldset>
        </DialogContent>
      </Dialog>
    )
  )
}
