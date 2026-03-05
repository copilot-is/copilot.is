'use client';

import { useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ProviderTypes } from '@/lib/constant';
import { api } from '@/trpc/react';
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

export default function ProvidersPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const utils = api.useUtils();
  const { data: providers, isLoading } = api.provider.list.useQuery();

  const createMutation = api.provider.create.useMutation({
    onSuccess: () => {
      utils.provider.list.invalidate();
      setIsOpen(false);
      resetForm();
    },
    onError: error => toast.error(error.message)
  });

  const updateMutation = api.provider.update.useMutation({
    onSuccess: () => {
      utils.provider.list.invalidate();
      setIsOpen(false);
      setEditingId(null);
      resetForm();
    },
    onError: error => toast.error(error.message)
  });

  const deleteMutation = api.provider.delete.useMutation({
    onSuccess: () => {
      utils.provider.list.invalidate();
    },
    onError: error => toast.error(error.message)
  });

  const toggleMutation = api.provider.toggleEnabled.useMutation({
    onSuccess: () => {
      utils.provider.list.invalidate();
    },
    onError: error => toast.error(error.message)
  });

  const [formData, setFormData] = useState({
    name: '',
    type: 'openai' as const,
    apiKey: '',
    image: '',
    baseUrl: '',
    isEnabled: true,
    apiOptions: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'openai',
      apiKey: '',
      image: '',
      baseUrl: '',
      isEnabled: true,
      apiOptions: ''
    });
  };

  const handleEdit = (provider: any) => {
    setEditingId(provider.id);
    setFormData({
      name: provider.name,
      type: provider.type,
      apiKey: '',
      image: provider.image || '',
      baseUrl: provider.baseUrl || '',
      isEnabled: provider.isEnabled,
      apiOptions: provider.apiOptions
        ? JSON.stringify(provider.apiOptions, null, 2)
        : ''
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let apiOptions: Record<string, unknown> | null | undefined;
    try {
      if (formData.apiOptions) {
        apiOptions = JSON.parse(formData.apiOptions);
      } else {
        // create: omit the field (undefined); update: clear it (null)
        apiOptions = editingId ? null : undefined;
      }
    } catch {
      toast.error('Invalid JSON format');
      return;
    }
    const data = {
      ...formData,
      apiOptions
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(
        data as Parameters<typeof createMutation.mutate>[0]
      );
    }
  };

  const filteredProviders = providers?.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase())
  );

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
              placeholder="Search providers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
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
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Provider' : 'Add Provider'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="OpenAI"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={value =>
                    setFormData({ ...formData, type: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ProviderTypes.map(id => (
                      <SelectItem key={id.value} value={id.value}>
                        {id.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Textarea
                  id="apiKey"
                  value={formData.apiKey}
                  onChange={e =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  placeholder={
                    editingId
                      ? providers?.find(p => p.id === editingId)?.maskedKey
                      : 'Enter API Key'
                  }
                  required={!editingId}
                  className="font-mono"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL (optional)</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl}
                  onChange={e =>
                    setFormData({ ...formData, baseUrl: e.target.value })
                  }
                  placeholder="https://"
                />
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiOptions">API Options (JSON)</Label>
                <Textarea
                  id="apiOptions"
                  value={formData.apiOptions}
                  onChange={e =>
                    setFormData({ ...formData, apiOptions: e.target.value })
                  }
                  placeholder="{}"
                  className="font-mono"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, isEnabled: checked })
                  }
                />
                <Label htmlFor="isEnabled">Enabled</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingId ? 'Update' : 'Create'}
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
              <th className="w-28 p-3 text-left text-sm font-medium">Type</th>
              <th className="w-20 p-3 text-center text-sm font-medium">
                Models
              </th>
              <th className="w-20 p-3 text-center text-sm font-medium">
                Enabled
              </th>
              <th className="w-24 p-3 text-right text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProviders?.map(provider => (
              <tr key={provider.id} className="border-b">
                <td className="p-3">
                  {provider.image ? (
                    <ModelIcon image={provider.image} className="size-8" />
                  ) : (
                    <div className="size-8 rounded border bg-muted" />
                  )}
                </td>
                <td className="p-3">{provider.name}</td>
                <td className="p-3">
                  <span className="rounded bg-muted px-2 py-1 text-xs">
                    {provider.type}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {provider.models?.length || 0}
                </td>
                <td className="p-3 text-center">
                  <Switch
                    checked={provider.isEnabled}
                    onCheckedChange={checked =>
                      toggleMutation.mutate({
                        id: provider.id,
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
                        onClick={() => handleEdit(provider)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Provider</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this provider?')) {
                            deleteMutation.mutate({ id: provider.id });
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Provider</TooltipContent>
                  </Tooltip>
                </td>
              </tr>
            ))}
            {(!filteredProviders || filteredProviders.length === 0) && (
              <tr>
                <td
                  colSpan={6}
                  className="p-6 text-center text-muted-foreground"
                >
                  {search
                    ? 'No providers found matching your search.'
                    : 'No providers configured. Add your first provider to get started.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
