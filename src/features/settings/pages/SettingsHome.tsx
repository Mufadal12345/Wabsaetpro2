import React from 'react';
import { NavLink } from 'react-router-dom';
import { SIDEBAR_CONFIG } from '../config/sidebar.config';
import { useAuth } from '../../../../contexts/AuthContext';
import { Icons } from '../../../../components/Icons';

export const SettingsHome: React.FC = () => {
  const { currentUser, logout } = useAuth();
  
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-white">الإعدادات</h1>
      
      <div className="space-y-8">
        {SIDEBAR_CONFIG.map((group) => {
          const visibleItems = group.items.filter(item => isSuperAdmin ? true : !item.superAdminOnly);
          if (visibleItems.length === 0) return null;
          return (
          <div key={group.id}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">
              {group.title}
            </h3>
            <div className="grid gap-2">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-white/5 group-hover:bg-accent/10 transition-colors">
                        <Icon className="w-5 h-5 text-gray-400 group-hover:text-accent" />
                      </div>
                      <span className="font-medium text-gray-200 group-hover:text-white">{item.label}</span>
                    </div>
                    <Icons.ChevronDown className="w-4 h-4 text-gray-600 -rotate-90" />
                  </NavLink>
                );
              })}
            </div>
          </div>
          );
        })}

        {/* Other Section for Logout */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">
            أخرى
          </h3>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all text-red-400 font-bold"
          >
            <div className="p-2 rounded-xl bg-red-500/10">
              <Icons.LogOut className="w-5 h-5" />
            </div>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  );
};
