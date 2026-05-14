import React, { useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserAvatar } from "./UserAvatar";
import { 
  X, 
  LogOut, 
  FileText, 
  HelpCircle, 
  BarChart3, 
  Users, 
  Mail, 
  BellDot, 
  FolderTree, 
  MessageSquare, 
  MessagesSquare, 
  History, 
  Settings2
} from "lucide-react";
import { useSidebarBadges } from "../src/features/settings/hooks/useSidebarBadges";

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose }) => {
  const { currentUser: profile, logout } = useAuth();
  const { data: badges } = useSidebarBadges(profile?.id || '');
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!profile) return null;

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const menuItems = [
    { id: "suggestions", path: "/suggestions", label: "الرسائل والاقتراحات", icon: FileText, color: "text-teal-400", badgeKey: 'unread_messages' },
    { id: "about", path: "/about", label: "حول التطبيق", icon: HelpCircle, color: "text-slate-400" },
    { id: "settings", path: "/settings", label: "الإعدادات العامة", icon: Settings2, color: "text-pink-400" },
  ];

  const adminItems = [
    { path: "/admin", label: "لوحة التحكم", icon: BarChart3, color: "text-indigo-400" },
    { path: "/admin/members", label: "الأعضاء", icon: Users, color: "text-emerald-400" },
    { path: "/admin/messages", label: "الرسائل", icon: Mail, color: "text-blue-400" },
    { path: "/admin/notifications", label: "التنبيهات", icon: BellDot, color: "text-yellow-400" },
    { path: "/admin/sections", label: "الأقسام", icon: FolderTree, color: "text-orange-400" },
    { path: "/admin/comments", label: "التعليقات", icon: MessageSquare, color: "text-pink-400" },
    { path: "/admin/chat", label: "دردشة المديرين", icon: MessagesSquare, color: "text-violet-400" },
    { path: "/admin/audit", label: "سجل النشاطات", icon: History, color: "text-amber-400", superAdminOnly: true },
  ].filter(item => profile?.role === 'super_admin' ? true : !item.superAdminOnly);

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-[#001015]/95 backdrop-blur-2xl border-l border-white/10 z-[110] transform transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col font-tajawal shadow-[-20px_0_50px_rgba(0,0,0,0.8)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div
            onClick={() => handleNav(`/profile/${profile.id}`)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <UserAvatar user={profile} className="w-11 h-11 border-2 border-white/10 group-hover:border-pink-500/50 transition-all" />
            <div className="flex flex-col text-right">
              <span className="font-bold text-white text-base leading-tight group-hover:text-pink-400 transition-colors">
                {profile.name}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                {profile.role === 'super_admin' ? '👑 مدير رئيسي' : profile.role === 'admin' ? '🎖️ مدير النظام' : '👤 مستخدم'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-8 pb-32">
          {/* Main Nav */}
          <div className="space-y-1">
            <p className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-right opacity-50">
              التنقل الرئيسي
            </p>
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              const badgeCount = (badges as any)?.[item.badgeKey || ''];

              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-right transition-all group relative overflow-hidden
                    ${isActive ? "bg-white/10 text-white" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                >
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-500 rounded-l-full shadow-[0_0_15px_rgba(236,72,153,0.6)]" />
                  )}
                  <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-pink-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? "text-pink-500" : item.color}`} />
                  </div>
                  <span className="flex-1 font-bold text-[14px]">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Admin Section */}
          {(profile.role === 'admin' || profile.role === 'super_admin') && (
            <div className="space-y-1">
               <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mx-4 mb-4" />
               <p className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-right opacity-50">
                إدارة النظام
              </p>
              {adminItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-right transition-all group relative
                      ${isActive ? "bg-white/10 text-white" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                  >
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-pink-500 rounded-l-full shadow-[0_0_10px_rgba(236,72,153,0.4)]" />
                    )}
                    <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-pink-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                      <Icon className={`w-4.5 h-4.5 ${isActive ? "text-pink-500" : item.color}`} />
                    </div>
                    <span className="flex-1 font-medium text-[13px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#001015] via-[#001015] to-transparent pt-12">
          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
};
