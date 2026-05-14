import React from 'react';
import { useUserSettings } from '../hooks/useSettings';
import { useAuth } from '../../auth/hooks/useAuth';
import { Bell, Shield, Heart, UserPlus, AtSign } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const { profile } = useAuth();
  const { settings, updateSettings } = useUserSettings(profile?.id || '');

  if (!settings) return null;

  const toggleNotification = (key: keyof typeof settings.notifications) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    });
  };

  const notificationTypes = [
    { key: 'newFollowers', label: 'متابعون جدد', icon: UserPlus, color: 'text-blue-400' },
    { key: 'ideaLikes', label: 'إعجابات بالأفكار', icon: Heart, color: 'text-red-400' },
    { key: 'mentions', label: 'الإشارات (Mentions)', icon: AtSign, color: 'text-violet-400' },
    { key: 'systemUpdates', label: 'تحديثات النظام', icon: Shield, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Bell className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold">إشعارات التنبيه</h2>
      </div>

      <div className="space-y-3">
        {notificationTypes.map((notif) => {
          const isEnabled = settings.notifications[notif.key as keyof typeof settings.notifications];
          return (
            <div 
              key={notif.key}
              className="glass-card p-5 rounded-3xl border border-white/5 bg-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-white/5 ${notif.color}`}>
                  <notif.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-200">{notif.label}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">تلقي إشعارات عند حدوث هذا النشاط</p>
                </div>
              </div>
              
              <button
                onClick={() => toggleNotification(notif.key as any)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-all duration-200 focus:outline-none ${
                    isEnabled ? 'bg-pink-600' : 'bg-white/10'
                }`}
              >
                <span
                  className={`${
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block w-4 h-4 transform bg-white rounded-full transition-all duration-200`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-pink-500/5 rounded-3xl border border-pink-500/10 space-y-4">
        <h3 className="font-bold text-sm text-pink-400">ملخص البريد الإلكتروني</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          سنرسل لك ملخصاً أسبوعياً لأهم الأفكار والنشاطات التي قد تهمك. يمكنك إلغاء الاشتراك في أي وقت.
        </p>
        <button className="text-xs font-bold text-pink-500 hover:underline">
          إدارة اشتراكات البريد الإلكتروني →
        </button>
      </div>
    </div>
  );
};
