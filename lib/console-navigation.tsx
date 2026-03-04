import { Cpu, LayoutGrid, Settings, Type, Users, Zap } from 'lucide-react';

export const ConsoleNavigation = {
  navMain: [
    {
      title: 'Overview',
      url: '/console',
      icon: LayoutGrid
    },
    {
      title: 'Providers',
      url: '/console/providers',
      icon: Zap
    },
    {
      title: 'Models',
      url: '/console/models',
      icon: Cpu
    },
    {
      title: 'Prompts',
      url: '/console/prompts',
      icon: Type
    },
    {
      title: 'Settings',
      url: '/console/settings',
      icon: Settings
    },
    {
      title: 'Users',
      url: '/console/users',
      icon: Users
    }
  ]
};
