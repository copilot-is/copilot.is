'use client';

import * as React from 'react';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { useMediaQuery } from '@/hooks/use-media-query';

interface SidebarContextProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const defaultState = isMobile ? false : true;

  const [isSidebarOpen, setSidebarOpen, isLoading] = useLocalStorage<
    SidebarContextProps['isSidebarOpen'] | null
  >('sidebar', null);
  const isSidebarOpenState =
    isSidebarOpen === null ? defaultState : isSidebarOpen;

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpenState);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen: isSidebarOpenState,
        toggleSidebar,
        closeSidebar
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
