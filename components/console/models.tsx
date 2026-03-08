'use client';

import { useState } from 'react';
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/trpc/react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { ModelIcon } from '@/components/model-icon';

const CAPABILITIES = [
  { value: 'chat', label: 'Chat' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' }
];

export default function ModelsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCapability, setFilterCapability] = useState<string>('all');
  const [search, setSearch] = useState('');

  const utils = api.useUtils();
  const { data: models, isLoading } = api.model.list.useQuery();
  const { data: providers } = api.provider.list.useQuery();
  const { data: prompts } = api.prompt.list.useQuery({ type: 'system' });

  const createMutation = api.model.create.useMutation({
    onSuccess: () => {
      utils.model.list.invalidate();
      setIsOpen(false);
      resetForm();
    },
    onError: error => toast.error(error.message)
  });

  const updateMutation = api.model.update.useMutation({
    onSuccess: () => {
      utils.model.list.invalidate();
      setIsOpen(false);
      setEditingId(null);
      resetForm();
    },
    onError: error => toast.error(error.message)
  });

  const deleteMutation = api.model.delete.useMutation({
    onSuccess: () => {
      utils.model.list.invalidate();
      setDeleteId(null);
    },
    onError: error => toast.error(error.message)
  });

  const toggleMutation = api.model.toggleEnabled.useMutation({
    onSuccess: () => {
      utils.model.list.invalidate();
    },
    onError: error => toast.error(error.message)
  });

  const [formData, setFormData] = useState({
    name: '',
    modelId: '',
    providerId: '',
    capability: 'chat' as const,
    image: '',
    aliases: '',
    supportsVision: false,
    supportsReasoning: false,
    isEnabled: true,
    systemPromptId: '',
    uiOptions: '',
    apiParams: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      modelId: '',
      providerId: providers?.[0]?.id || '',
      capability: 'chat',
      image: '',
      aliases: '',
      supportsVision: false,
      supportsReasoning: false,
      isEnabled: true,
      systemPromptId: '',
      uiOptions: '',
      apiParams: ''
    });
  };

  const handleEdit = (model: any) => {
    setEditingId(model.id);
    setFormData({
      name: model.name,
      modelId: model.modelId,
      providerId: model.providerId,
      capability: model.capability,
      image: model.image || '',
      aliases: model.aliases?.join(', ') || '',
      supportsVision: model.supportsVision || false,
      supportsReasoning: model.supportsReasoning || false,
      isEnabled: model.isEnabled,
      systemPromptId: model.systemPromptId || '',
      uiOptions: model.uiOptions
        ? JSON.stringify(model.uiOptions, null, 2)
        : '',
      apiParams: model.apiParams ? JSON.stringify(model.apiParams, null, 2) : ''
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let uiOptions: Record<string, unknown> | null | undefined;
    let apiParams: Record<string, unknown> | null | undefined;
    try {
      if (formData.uiOptions) {
        uiOptions = JSON.parse(formData.uiOptions);
      } else {
        uiOptions = editingId ? null : undefined;
      }
      if (formData.apiParams) {
        apiParams = JSON.parse(formData.apiParams);
      } else {
        apiParams = editingId ? null : undefined;
      }
    } catch {
      toast.error('Invalid JSON format');
      return;
    }

    const systemPromptId =
      formData.systemPromptId || (editingId ? null : undefined);
    const aliases = formData.aliases
      ? formData.aliases
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : editingId
        ? []
        : undefined;
    const data = {
      ...formData,
      aliases,
      systemPromptId,
      uiOptions,
      apiParams
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(
        data as Parameters<typeof createMutation.mutate>[0]
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const filteredModels = models?.filter(m => {
    const matchesCapability =
      filterCapability === 'all' || m.capability === filterCapability;
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.modelId.toLowerCase().includes(search.toLowerCase()) ||
      m.provider?.name.toLowerCase().includes(search.toLowerCase());

    return matchesCapability && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex max-w-2xl flex-1 items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCapability} onValueChange={setFilterCapability}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Capabilities</SelectItem>
              {CAPABILITIES.map(cap => (
                <SelectItem key={cap.value} value={cap.value}>
                  {cap.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => {
                setEditingId(null);
                resetForm();
              }}
            >
              <Plus className="size-4" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Model' : 'Add Model'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="GPT-4o"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelId">Model ID</Label>
                  <Input
                    id="modelId"
                    value={formData.modelId}
                    onChange={e =>
                      setFormData({ ...formData, modelId: e.target.value })
                    }
                    placeholder="gpt-4o"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="providerId">Provider</Label>
                  <Select
                    value={formData.providerId}
                    onValueChange={value =>
                      setFormData({ ...formData, providerId: value })
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers?.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capability">Capability</Label>
                  <Select
                    value={formData.capability}
                    onValueChange={value =>
                      setFormData({ ...formData, capability: value as any })
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAPABILITIES.map(cap => (
                        <SelectItem key={cap.value} value={cap.value}>
                          {cap.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemPromptId">System Prompt (optional)</Label>
                <Select
                  value={formData.systemPromptId || 'none'}
                  onValueChange={value =>
                    setFormData({
                      ...formData,
                      systemPromptId: value === 'none' ? '' : value
                    })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {prompts?.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="image">Icon (optional)</Label>
                  <a
                    href="https://icons.lobehub.com/components/lobe-hub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Browse Icons
                  </a>
                </div>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={e =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="https:// or Base64 or IconName"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aliases">Aliases (optional)</Label>
                <Input
                  id="aliases"
                  value={formData.aliases}
                  onChange={e =>
                    setFormData({ ...formData, aliases: e.target.value })
                  }
                  placeholder="gpt-4, gpt-4-turbo"
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Model ID aliases, e.g. gpt-4, gpt-4-turbo
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uiOptions">UI Options (JSON)</Label>
                  <Textarea
                    id="uiOptions"
                    value={formData.uiOptions}
                    onChange={e =>
                      setFormData({ ...formData, uiOptions: e.target.value })
                    }
                    placeholder="{}"
                    className="font-mono"
                    rows={3}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    className="cursor-pointer text-left text-xs text-muted-foreground hover:text-primary"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        uiOptions: JSON.stringify(
                          {
                            size: '1024x1024',
                            sizes: ['1024x1024'],
                            aspectRatio: '16:9',
                            aspectRatios: ['16:9'],
                            duration: 6,
                            durations: [4, 6, 8],
                            resolution: '720p',
                            resolutions: ['720p'],
                            voice: '',
                            voices: [],
                            reasoning: false
                          },
                          null,
                          2
                        )
                      })
                    }
                    disabled={isPending}
                  >
                    {`{ "size":"", "sizes":[], "aspectRatio":"", "aspectRatios":[], "duration":6, "durations":[4,6,8], "resolution":"", "resolutions":[], "voice":"", "voices":[], "reasoning":false }`}
                  </button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiParams">API Params (JSON)</Label>
                  <Textarea
                    id="apiParams"
                    value={formData.apiParams}
                    onChange={e =>
                      setFormData({ ...formData, apiParams: e.target.value })
                    }
                    placeholder="{}"
                    className="font-mono"
                    rows={3}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    className="cursor-pointer text-left text-xs text-muted-foreground hover:text-primary"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        apiParams: JSON.stringify(
                          {
                            temperature: 0.7,
                            topP: 1,
                            topK: 0,
                            maxOutputTokens: 4096,
                            frequencyPenalty: 0,
                            presencePenalty: 0
                          },
                          null,
                          2
                        )
                      })
                    }
                    disabled={isPending}
                  >
                    {`{ "temperature":0.7, "topP":1, "topK":0, "maxOutputTokens":4096, "frequencyPenalty":0, "presencePenalty":0 }`}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="supportsVision"
                    checked={formData.supportsVision}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, supportsVision: checked })
                    }
                    disabled={isPending}
                  />
                  <Label htmlFor="supportsVision">Vision</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="supportsReasoning"
                    checked={formData.supportsReasoning}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, supportsReasoning: checked })
                    }
                    disabled={isPending}
                  />
                  <Label htmlFor="supportsReasoning">Reasoning</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isEnabled"
                    checked={formData.isEnabled}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, isEnabled: checked })
                    }
                    disabled={isPending}
                  />
                  <Label htmlFor="isEnabled">Enabled</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {isPending
                    ? 'Saving...'
                    : editingId
                      ? 'Save Changes'
                      : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-20 p-3 text-left text-sm font-medium">Icon</th>
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Model ID</th>
              <th className="p-3 text-left text-sm font-medium">Aliases</th>
              <th className="p-3 text-left text-sm font-medium">Provider</th>
              <th className="p-3 text-left text-sm font-medium">Capability</th>
              <th className="w-20 p-3 text-center text-sm font-medium">
                Enabled
              </th>
              <th className="w-24 p-3 text-right text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredModels?.map(model => (
              <tr
                key={model.id}
                className="border-b transition-colors hover:bg-muted/30"
              >
                <td className="p-3">
                  {model.image ? (
                    <ModelIcon image={model.image} className="size-8" />
                  ) : (
                    <div className="size-8 rounded border bg-muted" />
                  )}
                </td>
                <td className="p-3">{model.name}</td>
                <td className="p-3 font-mono text-sm">{model.modelId}</td>
                <td className="p-3 text-sm text-muted-foreground">
                  {model.aliases?.join(', ') || '-'}
                </td>
                <td className="p-3">{model.provider?.name}</td>
                <td className="p-3">
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {model.capability}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <Switch
                    checked={model.isEnabled}
                    onCheckedChange={checked =>
                      toggleMutation.mutate({
                        id: model.id,
                        isEnabled: checked
                      })
                    }
                  />
                </td>
                <td className="whitespace-nowrap p-3 text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(model)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Model</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteId(model.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Model</TooltipContent>
                  </Tooltip>
                </td>
              </tr>
            ))}
            {(!filteredModels || filteredModels.length === 0) && (
              <tr>
                <td
                  colSpan={8}
                  className="p-6 text-center text-muted-foreground"
                >
                  No models configured. Add your first model to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this model? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate({ id: deleteId });
                }
              }}
              disabled={deleteMutation.isPending}
              variant="destructive"
              className="gap-2"
            >
              {deleteMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
