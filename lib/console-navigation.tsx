import {
  BarChart3,
  CircleDollarSign,
  Cpu,
  CreditCard,
  Gauge,
  LayoutGrid,
  Settings,
  Type,
  Users,
  Zap
} from 'lucide-react';

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
      title: 'Pricing',
      url: '/console/pricing',
      icon: CircleDollarSign
    },
    {
      title: 'Quotas',
      url: '/console/quotas',
      icon: Gauge
    },
    {
      title: 'Plans',
      url: '/console/plans',
      icon: CreditCard
    },
    {
      title: 'Usage',
      url: '/console/usage',
      icon: BarChart3
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
