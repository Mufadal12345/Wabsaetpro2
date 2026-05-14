import React from 'react';
import { useUserSettings } from '../hooks/useSettings';
import { useAuth } from '../../auth/hooks/useAuth';
import { Paintbrush, Moon, Sun, Monitor } from 'lucide-react';

export const AppearanceSettings: React.FC = () => {
  const { profile } = useAuth();
  const { settings, updateSettings } = useUserSettings(profile?.id || '');

  if (!settings) return null;

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    updateSettings({ appearance: { ...settings.appearance, theme: newTheme } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Paintbrush className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold">المظهر والسمات</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'dark', label: 'الوضع الداكن', sub: 'رؤية مريحة في الليل', icon: Moon },
          { id: 'light', label: 'الوضع الفاتح', sub: 'تباين عالٍ ووضوح', icon: Sun },
          { id: 'system', label: 'تلقائي', sub: 'حسب إعدادات جهازك', icon: Monitor },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => handleThemeChange(t.id as any)}
            className={`flex flex-col items-center gap-4 p-6 rounded-3xl border transition-all ${
              settings.appearance.theme === t.id
                ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
            }`}
          >
            <t.icon className="w-8 h-8" />
            <div className="text-center">
              <p className="font-bold text-sm">{t.label}</p>
              <p className="text-[10px] opacity-60 mt-1">{t.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
