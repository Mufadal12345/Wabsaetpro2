import React from 'react';
import { AuthService } from '../../auth/services/auth.service';
import { Monitor, LogOut, Clock, Info } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export const SessionsSettings: React.FC = () => {
  const queryClient = useQueryClient();

  const handleLogoutAll = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من هذا الجهاز؟')) {
      queryClient.clear();
      await AuthService.logout();
    }
  };

  const currentDevice = {
    browser: navigator.userAgent.split(' ')[0],
    os: navigator.userAgent.split('(')[1]?.split(';')[0] || 'Unknown OS',
    lastActive: 'الآن',
    isCurrent: true
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Clock className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold">الجلسات والأجهزة</h2>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-2xl flex gap-3 text-sm">
        <Info className="w-5 h-5 flex-shrink-0" />
        <p>تُظهر هذه القائمة الأجهزة التي سجلت الدخول إلى حسابك مؤخراً.</p>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
              <Monitor className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{currentDevice.browser} على {currentDevice.os}</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/10 uppercase">
                  نشط الآن
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">الموقع التقريبي: غير متاح حالياً</p>
            </div>
          </div>
          <button 
            onClick={handleLogoutAll}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <section className="mt-8 space-y-4">
        <h3 className="font-bold text-gray-400 text-sm px-2">إجراءات إضافية</h3>
        <button 
          onClick={handleLogoutAll}
          className="w-full p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all font-bold"
        >
          <LogOut className="w-5 h-5" />
          <span>تسجيل الخروج من كافة الجلسات</span>
        </button>
      </section>
    </div>
  );
};
