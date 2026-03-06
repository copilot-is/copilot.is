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
];

const CAPABILITIES = [
  { value: 'chat', label: 'Chat' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' }
];

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'xai', label: 'xAI' },
  { value: 'deepseek', label: 'DeepSeek' }
];

type PromptFormData = {
  name: string;
  type: 'system' | 'user';
  capability: 'chat' | 'image' | 'video' | 'audio' | null;
  providers: string[];
  image: string;
  content: string;
};

export default function PromptsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCapability, setFilterCapability] = useState<string>('all');
  const [search, setSearch] = useState('');

  const utils = api.useUtils();
  const { data: prompts, isLoading } = api.prompt.list.useQuery();

  const createMutation = api.prompt.create.useMutation({
    onSuccess: () => {
      utils.prompt.list.invalidate();
      setIsOpen(false);
      resetForm();
    },
    onError: error => toast.error(error.message)
  });

  const updateMutation = api.prompt.update.useMutation({
    onSuccess: () => {
      utils.prompt.list.invalidate();
      setIsOpen(false);
      setEditingId(null);
      resetForm();
    },
    onError: error => toast.error(error.message)
  });

  const deleteMutation = api.prompt.delete.useMutation({
    onSuccess: () => {
      utils.prompt.list.invalidate();
      setDeleteId(null);
    },
    onError: error => toast.error(error.message)
  });

  const [formData, setFormData] = useState<PromptFormData>({
    name: '',
    type: 'system',
    capability: null,
    providers: [],
    image: '',
    content: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'system',
      capability: null,
      providers: [],
      image: '',
      content: ''
    });
  };

  const handleEdit = (prompt: any) => {
    setEditingId(prompt.id);

    // Migrate legacy capabilities
    let capability = prompt.capability;
    if (capability === 'text') capability = 'chat';
    if (capability === 'speech') capability = 'audio';

    setFormData({
      name: prompt.name,
      type: prompt.type,
      capability: capability || null,
      providers: prompt.providers || [],
      image: prompt.image || '',
      content: prompt.content
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      type: formData.type,
      capability: formData.capability,
      providers: formData.providers.length > 0 ? formData.providers : null,
      image: formData.image || null,
      content: formData.content
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleProvider = (provider: string) => {
    if (formData.providers.includes(provider)) {
      setFormData({
        ...formData,
        providers: formData.providers.filter(p => p !== provider)
      });
    } else {
      setFormData({
        ...formData,
        providers: [...formData.providers, provider]
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const filteredPrompts = prompts?.filter(p => {
    if (filterType !== 'all' && p.type !== filterType) return false;
    if (filterCapability !== 'all' && p.capability !== filterCapability)
      return false;
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.content.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
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
              placeholder="Search prompts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PROMPT_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
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
              {CAPABILITIES.map(c => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
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
              Add Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Prompt' : 'Add Prompt'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                      setFormData({ ...formData, type: value as any })
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROMPT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
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
                    value={formData.capability || 'none'}
                    onValueChange={value =>
                      setFormData({
                        ...formData,
                        capability: value === 'none' ? null : (value as any)
                      })
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All capabilities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All</SelectItem>
                      {CAPABILITIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Providers</Label>
                  <div className="flex flex-wrap gap-2">
                    {PROVIDERS.map(p => (
                      <label
                        key={p.value}
                        className="flex cursor-pointer items-center gap-1.5"
                      >
                        <Checkbox
                          checked={formData.providers.includes(p.value)}
                          onCheckedChange={() => toggleProvider(p.value)}
                          disabled={isPending}
                        />
                        <span className="text-sm">{p.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave empty for all providers
                  </p>
                </div>
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
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                        disabled={isPending}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex size-24 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
                      <input
                        type="file"
                        accept="image/*"
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
                  Max 2MB. Supports JPEG, PNG, GIF, WebP, SVG.
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
                  {prompt.providers &&
                  (prompt.providers as string[]).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {(prompt.providers as string[]).map(p => (
                        <span
                          key={p}
                          className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">All</span>
                  )}
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
                  ) : (
                    <span className="text-xs text-muted-foreground">All</span>
                  )}
                </td>
                <td className="whitespace-nowrap p-3 text-right">
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
                        onClick={() => {
                          setDeleteId(prompt.id);
                        }}
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
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
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
