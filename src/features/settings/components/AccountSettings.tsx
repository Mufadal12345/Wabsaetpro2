import React from 'react';
import { useUserSettings } from '../hooks/useSettings';
import { useAuth } from '../../auth/hooks/useAuth';

export const AccountSettings: React.FC = () => {
  const { profile } = useAuth();
  const { settings, isLoading, updateSettings } = useUserSettings(profile?.id || '');

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="glass-card p-6 rounded-2xl">
      <h3 className="text-xl font-bold mb-4">إعدادات الحساب</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">اسم المستخدم</label>
          <input
            type="text"
            value={settings?.account.username || ''}
            onChange={(e) => updateSettings({ account: { ...settings?.account, username: e.target.value } })}
            className="input-style w-full px-4 py-2 rounded-xl bg-white/5"                
          />
        </div>
        {/* Further fields for bio, etc */}
      </div>
    </div>
  );
};
