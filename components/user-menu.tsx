'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { signOut } from 'next-auth/react';

import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const [user, setUser] = useState<User>();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    fetchUser();
  }, []);

  return (
    <div className="flex items-center justify-center">
      {isLoading && <div className="size-7 rounded-full bg-zinc-300"></div>}
      {!isLoading && user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Image
                className="size-7 select-none rounded-full ring-1 ring-zinc-100/10 transition-opacity duration-300 hover:opacity-80"
                src={user.image ? `${user.image}` : ''}
                alt={user.name ?? 'Avatar'}
                height={48}
                width={48}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            sideOffset={8}
            align="start"
            className="w-[180px]"
          >
            <DropdownMenuItem className="flex-col items-start">
              <div className="text-xs font-medium">{user.name}</div>
              <div className="text-xs text-zinc-500">{user.email}</div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                signOut({
                  callbackUrl: '/'
                })
              }
              className="text-xs"
            >
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
