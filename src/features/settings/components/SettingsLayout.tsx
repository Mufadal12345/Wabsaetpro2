import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { SIDEBAR_CONFIG } from '../config/sidebar.config';
import { useAuth } from '../../../../contexts/AuthContext';
import { Icons } from '../../../../components/Icons';

export const SettingsLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  
  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <div className="flex h-full bg-[#050505] text-white">
      {/* Settings Sidebar */}
      <aside className="w-64 border-l border-white/10 hidden md:block overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">الإعدادات</h2>
          {SIDEBAR_CONFIG.map((group) => {
            const visibleItems = group.items.filter(item => isSuperAdmin ? true : !item.superAdminOnly);
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.id} className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-4">
                  {group.title}
                </h3>
                <nav className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                      key={item.id}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                          isActive
                            ? 'bg-accent/10 text-accent'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            );
          })}
          {/* Other Section */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-4">
              أخرى
            </h3>
            <div className="space-y-1">
              <button
                 onClick={() => logout()}
                 className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Icons.LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Settings Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};
