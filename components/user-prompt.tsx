'use client';

import { useMemo, useRef, useState } from 'react';
import { Copy, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { CAPABILITIES } from '@/lib/constant';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
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

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'xai', label: 'xAI' },
  { value: 'deepseek', label: 'DeepSeek' }
] as const;

type MyPrompt = RouterOutputs['prompt']['list'][number];
type PromptCapability = (typeof CAPABILITIES)[number]['value'];

type PromptFormData = {
  name: string;
  capability: PromptCapability;
  providers: string[];
  image: string;
  content: string;
  isPublic: boolean;
};

const EMPTY_FORM: PromptFormData = {
  name: '',
  capability: 'chat',
  providers: [],
  image: '',
  content: '',
  isPublic: false
};

const matchesCapability = (
  capability: string | null | undefined,
  filterCapability: string
) => {
  if (filterCapability === 'all') return true;
  return (capability ?? 'chat') === filterCapability;
};

const getVisibilitySummary = (isPublic: boolean) =>
  isPublic ? 'Visible in the shared prompt picker.' : 'Only visible to you.';

const PromptThumbnail = ({
  content,
  image,
  name
}: {
  content: string;
  image?: string | null;
  name: string;
}) => {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="size-12 rounded-md border object-cover"
      />
    );
  }

  return (
    <div className="flex size-12 items-start overflow-hidden rounded-md border bg-muted p-1">
      <p className="line-clamp-4 text-[9px] leading-3 whitespace-pre-wrap text-muted-foreground">
        {content}
      </p>
    </div>
  );
};

export const UserPrompt = () => {
  const { copyToClipboard } = useCopyToClipboard();
  const utils = api.useUtils();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCapability, setFilterCapability] = useState<string>('all');
  const [formData, setFormData] = useState<PromptFormData>(EMPTY_FORM);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data: myPrompts, isLoading } = api.prompt.list.useQuery();

  const resetForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsUploadingImage(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const closeDialog = () => {
    setIsOpen(false);
    resetForm();
  };

  const invalidatePrompts = async () => {
    await Promise.all([
      utils.prompt.list.invalidate(),
      utils.prompt.listUsable.invalidate()
    ]);
  };

  const createMutation = api.prompt.create.useMutation({
    onSuccess: async () => {
      await invalidatePrompts();
      closeDialog();
      toast.success('Prompt saved');
    },
    onError: error => toast.error(error.message)
  });

  const updateMutation = api.prompt.update.useMutation({
    onSuccess: async () => {
      await invalidatePrompts();
      closeDialog();
      toast.success('Prompt updated');
    },
    onError: error => toast.error(error.message)
  });

  const deleteMutation = api.prompt.delete.useMutation({
    onSuccess: async () => {
      await invalidatePrompts();
      setDeleteId(null);
      toast.success('Prompt deleted');
    },
    onError: error => toast.error(error.message)
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isFormBusy = isSubmitting || isUploadingImage;

  const filteredPrompts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return (myPrompts ?? []).filter(prompt => {
      if (!matchesCapability(prompt.capability, filterCapability)) {
        return false;
      }

      if (
        keyword &&
        !prompt.name.toLowerCase().includes(keyword) &&
        !prompt.content.toLowerCase().includes(keyword)
      ) {
        return false;
      }

      return true;
    });
  }, [filterCapability, myPrompts, search]);

  const deletePrompt =
    myPrompts?.find(prompt => prompt.id === deleteId) ?? null;

  const handleCreate = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleEdit = (prompt: MyPrompt) => {
    setEditingId(prompt.id);
    setFormData({
      name: prompt.name,
      capability: (prompt.capability ?? 'chat') as PromptCapability,
      providers: prompt.providers || [],
      image: prompt.image || '',
      content: prompt.content,
      isPublic: prompt.isPublic
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = formData.name.trim();
    const content = formData.content.trim();

    if (!name || !content) {
      toast.error('Name and content are required');
      return;
    }

    const payload = {
      name,
      capability: formData.capability,
      providers: formData.providers.length > 0 ? formData.providers : null,
      image: formData.image || null,
      content,
      isPublic: formData.isPublic
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleProviderToggle = (provider: string) => {
    setFormData(current => ({
      ...current,
      providers: current.providers.includes(provider)
        ? current.providers.filter(item => item !== provider)
        : [...current.providers, provider]
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller');
      e.target.value = '';
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', file);
    setIsUploadingImage(true);

    try {
      const response = await fetch('/api/files/upload?type=prompts', {
        method: 'POST',
        body: uploadData
      });
      const result = await response.json();

      if (!response.ok || !result.url) {
        toast.error(result.error || 'Upload failed');
        return;
      }

      setFormData(current => ({
        ...current,
        image: result.url
      }));
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
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
    <div className="flex flex-col">
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_128px_auto]">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or content"
              className="pl-9"
            />
          </div>
          <Select value={filterCapability} onValueChange={setFilterCapability}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Capability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {CAPABILITIES.map(capability => (
                <SelectItem key={capability.value} value={capability.value}>
                  {capability.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="size-4" />
            Add Prompt
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-20 p-3 text-left text-sm font-medium">
                  Image
                </th>
                <th className="p-3 text-left text-sm font-medium">Name</th>
                <th className="p-3 text-left text-sm font-medium">Providers</th>
                <th className="w-28 p-3 text-left text-sm font-medium">
                  Capability
                </th>
                <th className="w-24 p-3 text-left text-sm font-medium">
                  Public
                </th>
                <th className="w-28 p-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPrompts.map(prompt => (
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
                    {prompt.capability ? (
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {prompt.capability}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <span className="rounded bg-muted px-2 py-1 text-xs">
                      {prompt.isPublic ? 'public' : 'private'}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(prompt.content)}
                        >
                          <Copy className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Prompt</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
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
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(prompt.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Prompt</TooltipContent>
                    </Tooltip>
                  </td>
                </tr>
              ))}

              {filteredPrompts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-muted-foreground"
                  >
                    {myPrompts?.length
                      ? 'No prompts match the current filter.'
                      : 'No prompts configured. Add your first prompt to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={open => {
          if (!open) {
            if (isFormBusy) return;
            closeDialog();
            return;
          }
          setIsOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Prompt' : 'Add Prompt'}
            </DialogTitle>
            <DialogDescription>Manage your prompt.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="-mx-6 max-h-[60vh] space-y-3.5 overflow-y-auto px-6">
              <div className="grid gap-3 sm:grid-cols-[1fr_132px]">
                <div className="space-y-2">
                  <Label htmlFor="prompt-name">Name</Label>
                  <Input
                    id="prompt-name"
                    value={formData.name}
                    onChange={e =>
                      setFormData(current => ({
                        ...current,
                        name: e.target.value
                      }))
                    }
                    placeholder="Research prompt"
                    required
                    disabled={isFormBusy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt-capability">Capability</Label>
                  <Select
                    value={formData.capability}
                    onValueChange={value =>
                      setFormData(current => ({
                        ...current,
                        capability: value as PromptCapability
                      }))
                    }
                    disabled={isFormBusy}
                  >
                    <SelectTrigger id="prompt-capability">
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
                <Label htmlFor="prompt-content">Content</Label>
                <Textarea
                  id="prompt-content"
                  value={formData.content}
                  onChange={e =>
                    setFormData(current => ({
                      ...current,
                      content: e.target.value
                    }))
                  }
                  rows={6}
                  placeholder="Rewrite this draft to sound more concise and confident..."
                  required
                  disabled={isFormBusy}
                />
              </div>

              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-center gap-3">
                  <PromptThumbnail
                    name={formData.name || 'Prompt image'}
                    image={formData.image}
                    content={formData.content || 'Preview'}
                  />
                  <div className="space-y-2">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      disabled={isFormBusy}
                      onChange={handleImageChange}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isFormBusy}
                      >
                        {isUploadingImage && (
                          <Loader2 className="size-4 animate-spin" />
                        )}
                        {formData.image ? 'Replace image' : 'Upload image'}
                      </Button>
                      {formData.image && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFormData(current => ({
                              ...current,
                              image: ''
                            }))
                          }
                          disabled={isFormBusy}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Max 5MB.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Providers</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PROVIDERS.map(provider => (
                    <label
                      key={provider.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={formData.providers.includes(provider.value)}
                        onCheckedChange={() =>
                          handleProviderToggle(provider.value)
                        }
                        disabled={isFormBusy}
                      />
                      <span>{provider.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to allow all providers.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <div className="space-y-1">
                  <Label htmlFor="prompt-public">Public</Label>
                  <p className="text-xs text-muted-foreground">
                    {getVisibilitySummary(formData.isPublic)}
                  </p>
                </div>
                <Switch
                  id="prompt-public"
                  checked={formData.isPublic}
                  onCheckedChange={checked =>
                    setFormData(current => ({
                      ...current,
                      isPublic: checked
                    }))
                  }
                  disabled={isFormBusy}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isFormBusy}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isFormBusy}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {editingId ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={open => {
          if (!open && !deleteMutation.isPending) {
            setDeleteId(null);
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              {deletePrompt
                ? `Delete "${deletePrompt.name}" from your prompt library?`
                : 'Delete this prompt from your prompt library?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={event => {
                event.preventDefault();
                if (deleteId) {
                  deleteMutation.mutate({ id: deleteId });
                }
              }}
            >
              {deleteMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
