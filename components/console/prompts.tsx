'use client';

import { useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { ModelCapability } from '@/types/model';
import { CAPABILITIES } from '@/lib/constant';
import { api, RouterOutputs } from '@/trpc/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

const PROMPT_TYPES = [
  { value: 'system', label: 'System' },
  { value: 'user', label: 'User' }
] as const;

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'xai', label: 'xAI' },
  { value: 'deepseek', label: 'DeepSeek' }
] as const;

type AdminPrompt = RouterOutputs['prompt']['adminList'][number];
type PromptType = 'system' | 'user';
type PromptTypeFilter = 'all' | PromptType;

type PromptFormData = {
  name: string;
  type: PromptType;
  capability: ModelCapability;
  providers: string[];
  image: string;
  content: string;
};

const EMPTY_FORM: PromptFormData = {
  name: '',
  type: 'system',
  capability: 'chat',
  providers: [],
  image: '',
  content: ''
};

const matchesCapability = (
  capability: string | null | undefined,
  filterCapability: string
) => {
  if (filterCapability === 'all') return true;
  return capability === null || capability === filterCapability;
};

export default function PromptsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AdminPrompt | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<AdminPrompt | null>(null);
  const [filterType, setFilterType] = useState<PromptTypeFilter>('all');
  const [filterCapability, setFilterCapability] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<PromptFormData>(EMPTY_FORM);

  const utils = api.useUtils();
  const { data: prompts, isLoading } = api.prompt.adminList.useQuery();

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingPrompt(null);
  };

  const invalidatePrompts = async () => {
    await Promise.all([
      utils.prompt.adminList.invalidate(),
      utils.prompt.listUsable.invalidate()
    ]);
  };

  const adminCreateMutation = api.prompt.adminCreate.useMutation({
    onSuccess: async () => {
      await invalidatePrompts();
      setIsOpen(false);
      resetForm();
    },
    onError: error => toast.error(error.message)
  });

  const adminUpdateMutation = api.prompt.adminUpdate.useMutation({
    onSuccess: async () => {
      await invalidatePrompts();
      setIsOpen(false);
      resetForm();
    },
    onError: error => toast.error(error.message)
  });

  const adminDeleteMutation = api.prompt.adminDelete.useMutation({
    onSuccess: async () => {
      await invalidatePrompts();
      setDeletePrompt(null);
    },
    onError: error => toast.error(error.message)
  });

  const isPending =
    adminCreateMutation.isPending || adminUpdateMutation.isPending;
  const isDeleting = adminDeleteMutation.isPending;

  const filteredPrompts = useMemo(() => {
    return prompts?.filter(prompt => {
      if (filterType !== 'all' && prompt.type !== filterType) return false;
      if (!matchesCapability(prompt.capability, filterCapability)) return false;
      if (
        search &&
        !prompt.name.toLowerCase().includes(search.toLowerCase()) &&
        !prompt.content.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [filterCapability, filterType, prompts, search]);

  const handleEdit = (prompt: AdminPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      type: prompt.type,
      capability: prompt.capability || 'chat',
      providers: prompt.providers || [],
      image: prompt.image || '',
      content: prompt.content
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = formData.name.trim();
    const content = formData.content.trim();

    if (!name || !content) {
      toast.error('Name and content are required');
      return;
    }

    const payload = {
      name,
      isPublic: formData.type === 'user',
      capability: formData.capability,
      providers: formData.providers.length > 0 ? formData.providers : null,
      image: formData.image || null,
      content
    };

    if (editingPrompt) {
      adminUpdateMutation.mutate({ id: editingPrompt.id, ...payload });
    } else {
      adminCreateMutation.mutate({ type: formData.type, ...payload });
    }
  };

  const toggleProvider = (provider: string) => {
    if (formData.providers.includes(provider)) {
      setFormData({
        ...formData,
        providers: formData.providers.filter(item => item !== provider)
      });
    } else {
      setFormData({
        ...formData,
        providers: [...formData.providers, provider]
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex max-w-2xl flex-1 items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filterType}
            onValueChange={value => setFilterType(value as PromptTypeFilter)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PROMPT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCapability} onValueChange={setFilterCapability}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Capability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Capabilities</SelectItem>
              {CAPABILITIES.map(capability => (
                <SelectItem key={capability.value} value={capability.value}>
                  {capability.label}
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
                resetForm();
              }}
            >
              <Plus className="size-4" />
              Add Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPrompt ? 'Edit Prompt' : 'Add Prompt'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="-mx-6 max-h-[60vh] space-y-4 overflow-y-auto px-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Default System Prompt"
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={value =>
                        setFormData({
                          ...formData,
                          type: value as PromptType
                        })
                      }
                      disabled={isPending || !!editingPrompt}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMPT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capability">Capability</Label>
                    <Select
                      value={formData.capability}
                      onValueChange={value =>
                        setFormData({
                          ...formData,
                          capability: value as PromptFormData['capability']
                        })
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger id="capability">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAPABILITIES.map(capability => (
                          <SelectItem
                            key={capability.value}
                            value={capability.value}
                          >
                            {capability.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Providers</Label>
                  <div className="flex flex-wrap gap-2">
                    {PROVIDERS.map(provider => (
                      <label
                        key={provider.value}
                        className="flex cursor-pointer items-center gap-1.5"
                      >
                        <Checkbox
                          checked={formData.providers.includes(provider.value)}
                          onCheckedChange={() => toggleProvider(provider.value)}
                          disabled={isPending}
                        />
                        <span className="text-sm">{provider.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave empty for all providers
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="flex items-start gap-4">
                    {formData.image ? (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="size-24 rounded border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, image: '' })
                          }
                          className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                          disabled={isPending}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex size-24 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          disabled={isPending}
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const formDataUpload = new FormData();
                            formDataUpload.append('file', file);

                            try {
                              const res = await fetch(
                                '/api/files/upload?type=prompts',
                                {
                                  method: 'POST',
                                  body: formDataUpload
                                }
                              );
                              const data = await res.json();

                              if (res.ok && data.url) {
                                setFormData({ ...formData, image: data.url });
                              } else {
                                toast.error(data.error || 'Upload failed');
                              }
                            } catch {
                              toast.error('Upload failed');
                            }
                          }}
                        />
                        <Plus className="size-6 text-muted-foreground" />
                        <span className="mt-1 text-xs text-muted-foreground">
                          Upload
                        </span>
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max 5MB. Supports JPEG, PNG, GIF, WebP.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={e =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="You are a helpful assistant..."
                    rows={8}
                    required
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables: {'{provider}'}, {'{modelId}'}, {'{date}'}
                  </p>
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
                    : editingPrompt
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
              <th className="w-20 p-3 text-left text-sm font-medium">Image</th>
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Providers</th>
              <th className="w-28 p-3 text-left text-sm font-medium">Type</th>
              <th className="w-28 p-3 text-left text-sm font-medium">
                Capability
              </th>
              <th className="w-24 p-3 text-right text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPrompts?.map(prompt => (
              <tr
                key={prompt.id}
                className="border-b transition-colors hover:bg-muted/30"
              >
                <td className="p-3">
                  {prompt.image ? (
                    <img
                      src={prompt.image}
                      alt=""
                      className="size-8 rounded border object-cover"
                    />
                  ) : (
                    <div className="size-8 rounded border bg-muted" />
                  )}
                </td>
                <td className="p-3">{prompt.name}</td>
                <td className="p-3">
                  {prompt.providers?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {prompt.providers.map(provider => (
                        <span
                          key={provider}
                          className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        >
                          {provider}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td className="p-3">
                  <span className="rounded bg-muted px-2 py-1 text-xs">
                    {prompt.type}
                  </span>
                </td>
                <td className="p-3">
                  {prompt.capability ? (
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {prompt.capability}
                    </span>
                  ) : null}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(prompt)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Prompt</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletePrompt(prompt)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Prompt</TooltipContent>
                  </Tooltip>
                </td>
              </tr>
            ))}
            {(!filteredPrompts || filteredPrompts.length === 0) && (
              <tr>
                <td
                  colSpan={6}
                  className="p-6 text-center text-muted-foreground"
                >
                  No prompts configured. Add your first prompt to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog
        open={!!deletePrompt}
        onOpenChange={open => !open && setDeletePrompt(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prompt? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                if (deletePrompt) {
                  adminDeleteMutation.mutate({ id: deletePrompt.id });
                }
              }}
              disabled={isDeleting}
              variant="destructive"
              className="gap-2"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
