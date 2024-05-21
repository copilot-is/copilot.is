'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { IconMoon, IconSun, IconSunMoon } from '@/components/ui/icons';
import { Tooltip } from '@/components/ui/tooltip';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Tooltip
      content={
        theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'
      }
    >
      <Button
        disabled={isPending}
        variant="ghost"
        size="icon"
        className="hover:bg-background"
        onClick={() => {
          startTransition(() => {
            switch (theme) {
              case 'dark':
                setTheme('light');
                break;
              case 'light':
                setTheme('system');
                break;
              default:
                setTheme('dark');
                break;
            }
          });
        }}
      >
        {mounted ? (
          <>
            {theme === 'dark' ? (
              <IconMoon className="size-5 transition-all" />
            ) : theme === 'light' ? (
              <IconSun className="size-5 transition-all" />
            ) : (
              <IconSunMoon className="size-5 transition-all" />
            )}
          </>
        ) : (
          <IconSunMoon className="size-5 transition-all" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </Tooltip>
  );
}
