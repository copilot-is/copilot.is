'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const DEFAULT_SETTINGS = [
  {
    key: 'app.name',
    label: 'App Name',
    description: 'Product name displayed in the UI'
  },
  {
    key: 'app.subtitle',
    label: 'App Subtitle',
    description: 'Product subtitle'
  },
  {
    key: 'app.description',
    label: 'App Description',
    description: 'Product description for SEO'
  },
  {
    key: 'default.chat.modelId',
    label: 'Default Chat Model',
    description: 'Default model for chat'
  },
  {
    key: 'default.image.modelId',
    label: 'Default Image Model',
    description: 'Default model for image generation'
  },
  {
    key: 'default.video.modelId',
    label: 'Default Video Model',
    description: 'Default model for video generation'
  },
  {
    key: 'default.tts.modelId',
    label: 'Default TTS Model',
    description: 'Default model for voice page'
  },
  {
    key: 'speech.enabled',
    label: 'Enable Speech',
    description: 'Enable or disable speech synthesis'
  },
  {
    key: 'default.speech.modelId',
    label: 'Default Speech Model',
    description: 'Default model for reading messages'
  },
  {
    key: 'default.speech.voice',
    label: 'Default Speech Voice',
    description: 'Default voice for reading messages'
  },
  {
    key: 'system.prompt',
    label: 'Default System Prompt',
    description: 'Default system prompt for chat'
  },
  {
    key: 'title.model',
    label: 'Title Generation Model',
    description: 'Model used for generating chat titles'
  },
  {
    key: 'title.prompt',
    label: 'Title Generation Prompt',
    description: 'Prompt used for generating titles'
  }
];

export default function SettingsPage() {
  const utils = api.useUtils();
  const { data: settings, isLoading } = api.settings.list.useQuery();
  const { data: models } = api.model.list.useQuery();
  const { data: prompts } = api.prompt.list.useQuery({ type: 'system' });

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      const data: Record<string, string> = {};
      settings.forEach(s => {
        data[s.key] = s.value || '';
      });
      setFormData(data);
    }
  }, [settings]);

  const bulkUpdateMutation = api.settings.bulkUpdate.useMutation({
    onSuccess: () => {
      utils.settings.list.invalidate();
      setHasChanges(false);
      toast.success('Settings saved successfully');
    },
    onError: error => toast.error(error.message)
  });

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updates = DEFAULT_SETTINGS.map(setting => ({
      key: setting.key,
      value: formData[setting.key] || null,
      description: setting.description
    }));
    bulkUpdateMutation.mutate(updates);
  };

  const chatModels = models?.filter(
    m => m.capability === 'chat' && m.isEnabled
  );
  const imageModels = models?.filter(
    m => m.capability === 'image' && m.isEnabled
  );
  const videoModels = models?.filter(
    m => m.capability === 'video' && m.isEnabled
  );
  const speechModels = models?.filter(
    m => m.capability === 'audio' && m.isEnabled
  );
  const systemPrompts = prompts?.filter(
    p => !p.capability || p.capability === 'chat'
  );

  // Get available voices for speech reading model
  const speechVoices = useMemo(() => {
    const selectedModel = speechModels?.find(
      m => m.modelId === formData['default.speech.modelId']
    );
    return (selectedModel?.uiOptions?.voices as string[]) || [];
  }, [speechModels, formData['default.speech.modelId']]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Application</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="app.name">App Name</Label>
                <Input
                  id="app.name"
                  value={formData['app.name'] || ''}
                  onChange={e => handleChange('app.name', e.target.value)}
                  placeholder="Copilot"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app.subtitle">App Subtitle</Label>
                <Input
                  id="app.subtitle"
                  value={formData['app.subtitle'] || ''}
                  onChange={e => handleChange('app.subtitle', e.target.value)}
                  placeholder="AI Chatbot"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="app.description">App Description</Label>
                <Textarea
                  id="app.description"
                  value={formData['app.description'] || ''}
                  onChange={e =>
                    handleChange('app.description', e.target.value)
                  }
                  placeholder="Your AI assistant..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Default Models</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Default Chat Model</Label>
                <Select
                  value={formData['default.chat.modelId'] || ''}
                  onValueChange={value =>
                    handleChange('default.chat.modelId', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {chatModels?.map(m => (
                      <SelectItem key={m.id} value={m.modelId}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Image Model</Label>
                <Select
                  value={formData['default.image.modelId'] || ''}
                  onValueChange={value =>
                    handleChange('default.image.modelId', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {imageModels?.map(m => (
                      <SelectItem key={m.id} value={m.modelId}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Video Model</Label>
                <Select
                  value={formData['default.video.modelId'] || ''}
                  onValueChange={value =>
                    handleChange('default.video.modelId', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoModels?.map(m => (
                      <SelectItem key={m.id} value={m.modelId}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default TTS Model</Label>
                <Select
                  value={formData['default.tts.modelId'] || ''}
                  onValueChange={value =>
                    handleChange('default.tts.modelId', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {speechModels?.map(m => (
                      <SelectItem key={m.id} value={m.modelId}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="mb-2 text-lg font-semibold">
              Text-to-Speech Reading
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Default settings for reading messages aloud.
            </p>
            <div className="mb-4 space-y-2">
              <Label>Enable Speech</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData['speech.enabled'] !== 'false'}
                  onCheckedChange={checked =>
                    handleChange('speech.enabled', String(checked))
                  }
                />
                <Label className="font-normal text-muted-foreground">
                  {formData['speech.enabled'] !== 'false'
                    ? 'Enabled'
                    : 'Disabled'}
                </Label>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Default Speech Model</Label>
                <Select
                  disabled={formData['speech.enabled'] === 'false'}
                  value={formData['default.speech.modelId'] || ''}
                  onValueChange={value =>
                    handleChange('default.speech.modelId', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {speechModels?.map(m => (
                      <SelectItem key={m.id} value={m.modelId}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Speech Voice</Label>
                <Select
                  disabled={formData['speech.enabled'] === 'false'}
                  value={formData['default.speech.voice'] || ''}
                  onValueChange={value =>
                    handleChange('default.speech.voice', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {speechVoices.map(v => (
                      <SelectItem key={v} value={v}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Title Generation</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title Generation Model</Label>
                <Select
                  value={formData['title.model'] || ''}
                  onValueChange={value => handleChange('title.model', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {chatModels?.map(m => (
                      <SelectItem key={m.id} value={m.modelId}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title Generation Prompt</Label>
                <Select
                  value={formData['title.prompt'] || ''}
                  onValueChange={value => handleChange('title.prompt', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemPrompts?.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">Default Prompts</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Default System Prompt</Label>
                <Select
                  value={formData['system.prompt'] || '_none'}
                  onValueChange={value =>
                    handleChange(
                      'system.prompt',
                      value === '_none' ? '' : value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select system prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {systemPrompts?.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The default system prompt used for new chat conversations.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-start">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || bulkUpdateMutation.isPending}
          className="gap-2"
        >
          <Save className="size-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
