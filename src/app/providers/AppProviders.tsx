import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../shared/lib/react-query';
import { AuthProvider as NewAuthProvider } from '../../features/auth/context/AuthContext';
import { ToastProvider } from '../../../contexts/ToastContext';
import { DataProvider } from '../../../contexts/DataContext'; 
import { AuthProvider as LegacyAuthProvider } from '../../../contexts/AuthContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <NewAuthProvider>
          <LegacyAuthProvider>
            <DataProvider>
              {children}
            </DataProvider>
          </LegacyAuthProvider>
        </NewAuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

