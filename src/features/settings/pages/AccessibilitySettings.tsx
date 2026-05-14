import React from 'react';
import { useUserSettings } from '../hooks/useSettings';
import { useAuth } from '../../auth/hooks/useAuth';
import { Accessibility, Type } from 'lucide-react';

export const AccessibilitySettings: React.FC = () => {
  const { profile } = useAuth();
  const { settings, updateSettings } = useUserSettings(profile?.id || '');

  if (!settings) return null;

  const handleFontSizeChange = (size: number) => {
    updateSettings({ appearance: { ...settings.appearance, fontScale: size } });
    const root = document.documentElement;
    root.style.setProperty('--user-font-size', size < 1 ? '0.875rem' : size > 1 ? '1.125rem' : '1rem');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Accessibility className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold">إمكانية الوصول</h2>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/5 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold">حجم الخط</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 0.875, label: 'صغير', size: '14px' },
            { id: 1, label: 'متوسط', size: '16px' },
            { id: 1.125, label: 'كبير', size: '18px' },
          ].map((fs) => (
            <button
              key={fs.id}
              onClick={() => handleFontSizeChange(fs.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                settings.appearance.fontScale === fs.id
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                  : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >
              <span style={{ fontSize: fs.size }} className="font-bold">A</span>
              <span className="text-xs">{fs.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 bg-white/5 rounded-xl text-center">
          <p className="text-gray-300">
            هذا نص تجريبي لمعاينة حجم الخط في التطبيق.
          </p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/5 space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="font-medium">تباين عالٍ</span>
          <div className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </div>
        </label>
        <p className="text-xs text-gray-500">تحسين وضوح العناصر والنصوص لسهولة القراءة.</p>
      </div>
    </div>
  );
};
