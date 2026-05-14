import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SettingsService } from '../services/settings.service';
import { UserSettings } from '../types/settings.types';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';

export const useUserSettings = (userId: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.settings.getUserSettings(userId),
    queryFn: () => SettingsService.getSettings(userId),
    enabled: !!userId,
  });

  // Apply settings globally
  useEffect(() => {
    if (data) {
      // 1. apply theme
      const root = window.document.documentElement;
      const theme = data.appearance.theme;
      
      if (theme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else if (theme === 'light') {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      } else {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        if (systemTheme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        root.style.colorScheme = systemTheme;
      }

      // 2. apply font scale
      const scale = data.appearance.fontScale || 1;
      root.style.setProperty('--user-font-size', `${scale}rem`);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (newSettings: Partial<UserSettings>) => SettingsService.updateSettings(userId, newSettings),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.settings.getUserSettings(userId) });
      const previousSettings = queryClient.getQueryData<UserSettings>(QUERY_KEYS.settings.getUserSettings(userId));
      
      queryClient.setQueryData(QUERY_KEYS.settings.getUserSettings(userId), (old: UserSettings | undefined) => {
        if (!old) return old;
        return {
          ...old,
          ...newSettings,
          account: { ...old.account, ...newSettings.account },
          privacy: { ...old.privacy, ...newSettings.privacy },
          notifications: { ...old.notifications, ...newSettings.notifications },
          appearance: { ...old.appearance, ...newSettings.appearance },
          accessibility: { ...old.accessibility, ...newSettings.accessibility },
        };
      });
      return { previousSettings };
    },
    onError: (_err, _newSettings, context) => {
      queryClient.setQueryData(QUERY_KEYS.settings.getUserSettings(userId), context?.previousSettings);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.getUserSettings(userId) });
    }
  });

  return {
    settings: data,
    isLoading,
    updateSettings: mutation.mutate
  };
};
