'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useRouter, usePathname } from 'next/navigation';

const OfflineStatusContext = createContext({
  isOfflineMode: false,
  toggleOfflineMode: () => {},
});

const OFFLINE_ALLOWED_PATHS = ['/consult', '/dashboard', '/offline-info', '/another-offline-page'];

export const OfflineStatusProvider = ({ children }) => {
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine); // 👈 Initialize based on actual status
  const router = useRouter();
  const pathname = usePathname();

  // Automatically switch mode based on system status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Browser is online');
      setIsOfflineMode(false);
    };

    const handleOffline = () => {
      console.log('Browser is offline');
      setIsOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Force redirect if offline and not in allowed route
  useEffect(() => {
    if (isOfflineMode && !OFFLINE_ALLOWED_PATHS.includes(pathname)) {
      router.replace('/consult');
    }
  }, [isOfflineMode, pathname, router]);

  const toggleOfflineMode = () => {
    // Prevent switching to online when actually offline
    if (!navigator.onLine) {
      console.warn("You're offline. Can't switch to online mode.");
      return;
    }

    setIsOfflineMode((prev) => !prev);
  };

  return (
    <OfflineStatusContext.Provider value={{ isOfflineMode, toggleOfflineMode }}>
      {children}
    </OfflineStatusContext.Provider>
  );
};

export const useOfflineStatus = () => useContext(OfflineStatusContext);

export function StatusBanner() {
  const { isOfflineMode, toggleOfflineMode } = useOfflineStatus();

  return (
    <div className="flex items-center gap-4">
      <span>{isOfflineMode ? 'Offline Mode' : 'Online Mode'}</span>
      <Switch checked={isOfflineMode} onCheckedChange={toggleOfflineMode} />
    </div>
  );
}
