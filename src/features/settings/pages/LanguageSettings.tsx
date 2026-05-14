import React from 'react';
import { useUserSettings } from '../hooks/useSettings';
import { useAuth } from '../../auth/hooks/useAuth';
import { Languages, Check } from 'lucide-react';

export const LanguageSettings: React.FC = () => {
  const { profile } = useAuth();
  const { settings, updateSettings } = useUserSettings(profile?.id || '');

  if (!settings) return null;

  const languages = [
    { id: 'ar', label: 'العربية (Arabic)', sub: 'اللغة الأساسية' },
    { id: 'en', label: 'English (الإنجليزية)', sub: 'Switch to English' },
  ];

  const handleLanguageChange = (lang: string) => {
    updateSettings({ language: lang });
    // In a real app, we'd trigger i18n change here
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Languages className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold">اللغة والمنطقة</h2>
      </div>

      <div className="space-y-3">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => handleLanguageChange(lang.id)}
            className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all ${
              settings.language === lang.id
                ? 'bg-pink-500/10 border-pink-500/30'
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="text-right">
              <p className={`font-bold ${settings.language === lang.id ? 'text-white' : 'text-gray-300'}`}>
                {lang.label}
              </p>
              <p className="text-xs text-gray-500">{lang.sub}</p>
            </div>
            {settings.language === lang.id && (
              <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
        <p className="text-xs text-gray-500 leading-relaxed">
          * ملاحظة: العربية هي اللغة الرسمية لـ "متحف الفكر". قد لا تتوفر بعض الترجمات الإنجليزية لكافة المحتويات.
        </p>
      </div>
    </div>
  );
};
