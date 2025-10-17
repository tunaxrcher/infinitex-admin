'use client';

import { createContext, ReactNode, useContext } from 'react';
import { SystemSetting } from 'src/shared/app/models/system';
import { UserRole } from 'src/shared/app/models/user';

interface SystemSettingsContextProps {
  settings: SystemSetting;
  roles: UserRole[];
}

interface SystemSettingsProviderProps extends SystemSettingsContextProps {
  children: ReactNode;
}

const SettingsContext = createContext<SystemSettingsContextProps | undefined>(
  undefined,
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({
  settings,
  roles,
  children,
}: SystemSettingsProviderProps) => {
  return (
    <SettingsContext.Provider value={{ settings, roles }}>
      {children}
    </SettingsContext.Provider>
  );
};
