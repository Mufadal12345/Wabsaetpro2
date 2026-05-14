import React from 'react';
import { useUserSettings } from '../hooks/useSettings';
import { useAuth } from '../../auth/hooks/useAuth';
import { Eye, EyeOff, ShieldAlert, UserX, Info } from 'lucide-react';

export const PrivacySettings: React.FC = () => {
  const { profile } = useAuth();
  const { settings, updateSettings } = useUserSettings(profile?.id || '');

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Eye className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold">الخصوصية والأمان</h2>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-200 p-4 rounded-2xl flex gap-3 text-sm">
        <Info className="w-5 h-5 flex-shrink-0" />
        <p>تحكم في من يمكنه رؤية ملفك الشخصي وأفكارك المنشورة.</p>
      </div>

      {/* Visibility Toggle */}
      <section className="glass-card p-6 rounded-3xl border border-white/10 bg-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-white/5 ${settings.privacy.accountVisibility === 'private' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {settings.privacy.accountVisibility === 'private' ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-200">رؤية الحساب</h3>
              <p className="text-xs text-gray-500 mt-1">
                {settings.privacy.accountVisibility === 'private' ? 'حسابك مخفي عن غير المتابعين' : 'حسابك متاح للجميع للاكتشاف'}
              </p>
            </div>
          </div>
          
          <select 
            value={settings.privacy.accountVisibility}
            onChange={(e) => updateSettings({ privacy: { ...settings.privacy, accountVisibility: e.target.value as any } })}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500/50"
          >
            <option value="public">عام</option>
            <option value="private">خاص</option>
          </select>
        </div>
      </section>

      {/* Blocking List */}
      <section className="glass-card p-6 rounded-3xl border border-white/10 bg-white/5 space-y-4">
        <div className="flex items-center gap-2 text-gray-300">
          <UserX className="w-5 h-5" />
          <h3 className="font-bold">الحسابات المحظورة</h3>
        </div>
        
        <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
          <ShieldAlert className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-xs text-gray-500">لم تقم بحظر أي مستخدم بعد.</p>
        </div>
      </section>

      <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
        <h4 className="text-xs font-bold text-red-400 mb-2">إجراءات حساسة</h4>
        <button className="text-xs text-red-500 hover:underline">حذف الحساب نهائياً</button>
      </div>
    </div>
  );
};
