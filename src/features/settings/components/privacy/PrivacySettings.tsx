import React from 'react';
import { useUserSettings } from '../../hooks/useSettings';
import { useAuth } from '../../../auth/hooks/useAuth';

export const PrivacySettings: React.FC = () => {
  const { profile } = useAuth();
  const { settings, updateSettings } = useUserSettings(profile?.id || '');

  if (!settings) return null;

  return (
    <div className="glass-card p-6 rounded-2xl">
      <h3 className="text-xl font-bold mb-4">إعدادات الخصوصية</h3>
      <div className="space-y-4">
        <label className="flex items-center justify-between">
          <span>حساب عام</span>
          <input
            type="checkbox"
            checked={settings.privacy.accountVisibility === 'public'}
            onChange={(e) => updateSettings({ privacy: { ...settings.privacy, accountVisibility: e.target.checked ? 'public' : 'private' } })}
          />
        </label>
      </div>
    </div>
  );
};
