'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch'; // Adjust import path as needed
import { useRouter, usePathname } from 'next/navigation';

const OfflineStatusContext = createContext({
  isOfflineMode: false,
  toggleOfflineMode: () => { },
});

const OFFLINE_ALLOWED_PATHS = ['/consult', '/offline-info', '/another-offline-page']; // Add all offline-allowed routes here

export const OfflineStatusProvider = ({ children }) => {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load mode from localStorage on mount
  useEffect(() => {
    const storedMode = localStorage.getItem('offlineMode');
    if (storedMode !== null) {
      setIsOfflineMode(storedMode === 'true');
    }
  }, []);

  // Handle going offline automatically
  useEffect(() => {
    const handleOffline = () => {
      setIsOfflineMode(true);
      console.log('Current mode: Offline (forced by offline event)');
      localStorage.setItem('offlineMode', 'true');
    };

    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist offlineMode and protect routes
  useEffect(() => {
    localStorage.setItem('offlineMode', isOfflineMode.toString());

    if (isOfflineMode) {
      console.log('Current mode: Offline (manual toggle or forced)');
      if (!OFFLINE_ALLOWED_PATHS.includes(pathname)) {
        router.replace('/consult');
      }
    }
  }, [isOfflineMode, pathname, router]);

  useEffect(() => {
    if (isOfflineMode) {
      if (!OFFLINE_ALLOWED_PATHS.includes(pathname)) {
        router.replace('/consult');
      }
    }
  }, [pathname, isOfflineMode, router]);

  const toggleOfflineMode = () => {
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
