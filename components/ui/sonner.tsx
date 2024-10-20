'use client';

import {
  CheckCircle,
  CircleNotch,
  Info,
  Warning,
  XCircle
} from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground'
        }
      }}
      icons={{
        success: (
          <CheckCircle weight="fill" className="size-5 fill-green-500" />
        ),
        info: <Info weight="fill" className="size-5 fill-blue-500" />,
        warning: <Warning weight="fill" className="size-5 fill-yellow-500" />,
        error: <XCircle weight="fill" className="size-5 fill-red-500" />,
        loading: (
          <CircleNotch className="size-5 animate-spin text-muted-foreground" />
        )
      }}
      {...props}
    />
  );
};

export { Toaster };
