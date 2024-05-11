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
import {
  IconSettings,
  IconCaretDown,
  IconCaretRight
} from '@/components/ui/icons'
import { Tooltip } from '@/components/ui/tooltip'
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { SupportedModels } from '@/lib/constant'
import { useSettings } from '@/lib/hooks/use-settings'

export const ModelSettingsDialog = () => {
  const [open, setOpen] = React.useState(false)
  const [isAdvancedSettingsOpen, setAdvancedSettingsOpen] =
    React.useState(false)

  const { availableModels, model, setModel, modelSettings, setModelSettings } =
    useSettings()
  const allowedModels = availableModels
    ? SupportedModels.filter(m => availableModels.includes(m.value))
    : SupportedModels
  const selectedModel = allowedModels.find(m => m.value === model)?.text

  const toggleAdvancedSettings = () => {
    setAdvancedSettingsOpen(!isAdvancedSettingsOpen)
  }

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
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Model Settings</DialogDescription>
        </DialogHeader>
        <fieldset>
          <label className="mb-1.5 block text-sm font-semibold">Model</label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>{selectedModel}</SelectTrigger>
            <SelectContent>
              {allowedModels.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="font-medium">{model.text}</div>
                  <div className="text-muted-foreground text-xs">
                    {model.value}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </fieldset>
        <fieldset>
          <label
            className="mb-1.5 block text-sm font-semibold"
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
            placeholder="Enter a prompt..."
            value={modelSettings.prompt ?? ''}
            onChange={e => setModelSettings('prompt', e.target.value)}
          />
        </fieldset>
        <fieldset>
          <label className="mb-1.5 block text-sm font-semibold">
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
            onValueChange={value => setModelSettings('temperature', value[0])}
          />
          <div className="flex justify-between">
            <div className="flex justify-center">Precise</div>
            <div className="flex justify-center">Neutral</div>
            <div className="flex justify-center">Creative</div>
          </div>
        </fieldset>
        <fieldset
          className="cursor-pointer text-lg font-medium"
          onClick={toggleAdvancedSettings}
        >
          Advanced Settings
          {isAdvancedSettingsOpen ? (
            <IconCaretDown className="ml-1 inline-block size-5" />
          ) : (
            <IconCaretRight className="ml-1 inline-block size-5" />
          )}
        </fieldset>
        {isAdvancedSettingsOpen && (
          <>
            <fieldset>
              <label className="mb-1.5 block text-sm font-semibold">
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
              <label className="mb-1.5 block text-sm font-semibold">
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
              <label className="mb-1.5 block text-sm font-semibold">
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
              <label className="mb-1.5 block text-sm font-semibold">
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
              <label className="mb-1.5 block text-sm font-semibold">
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
