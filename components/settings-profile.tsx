'use client';

import * as React from 'react';
import Image from 'next/image';
import { Camera, CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { useCurrentUser } from '@/hooks/use-current-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const SettingsProfile = () => {
  const { user, isLoading: isUserLoading, mutate } = useCurrentUser();
  const [name, setName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to upload avatar');
        return;
      }

      await mutate();
      toast.success('Avatar updated successfully');
    } catch (err) {
      toast.error('An error occurred while uploading avatar');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to update profile');
        return;
      }

      await mutate();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex size-full items-center justify-center">
        <CircleNotch className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Avatar Section */}
      <div className="flex items-center gap-4">
        <div
          className="group relative size-16 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/50"
          onClick={handleAvatarClick}
        >
          {user.image ? (
            <Image
              className="size-full object-cover"
              src={user.image}
              alt={user.name ?? ''}
              height={64}
              width={64}
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-primary/10 text-lg font-medium text-primary">
              {user.name
                ? user.name
                    .split(' ')
                    .map(word => word[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : (user.email?.[0] || '?').toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {isUploading ? (
              <CircleNotch className="size-4 animate-spin text-white" />
            ) : (
              <Camera className="size-4 text-white" />
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <div>
          <p className="text-sm font-medium">Photo</p>
          <p className="text-xs text-muted-foreground">
            Click to upload a new avatar
          </p>
        </div>
      </div>

      {/* Name Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium leading-none">
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isLoading}
            maxLength={100}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !name.trim() || name.trim() === user.name}
        >
          {isLoading ? (
            <CircleNotch className="size-4 animate-spin" />
          ) : (
            'Save Changes'
          )}
        </Button>
      </form>
    </div>
  );
};
