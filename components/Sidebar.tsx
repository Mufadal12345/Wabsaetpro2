import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { UserAvatar } from "./UserAvatar";
import { 
  LayoutDashboard, 
  Lightbulb, 
  UserCircle, 
  MessageSquare, 
  Library, 
  BrainCircuit, 
  Quote, 
  Zap, 
  FileText, 
  HelpCircle,
  BarChart3,
  Users,
  Mail,
  BellDot,
  FolderTree,
  MessagesSquare,
  History,
  Settings2,
  Building2,
  LogOut
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { messages, aboutSections } = useData();

  if (!currentUser) return null;

  const unreadMessagesCount = messages.filter(
    (m) => m.toUserId === currentUser?.id && !m.read
  ).length;

  const isSuperAdmin = currentUser.email === "rshashyb0@gmail.com" || currentUser.email === "mufadal735657255@gmail.com";

  // Get visibility settings for main sections from super admin's profile or a dedicated config
  const isSectionHidden = (sectionId: string) => {
    const section = aboutSections.find(s => s.id === sectionId);
    if (section) {
      if (section.hiddenByOwner && !isSuperAdmin) return true;
      if (!section.isVisible) return true; 
    }
    return false;
  };

  const menuItems = [
    { id: "home", path: "/", label: "الرئيسية", icon: LayoutDashboard, adminOnly: true, color: "group-hover:text-blue-400" },
    { id: "ideas", path: "/ideas", label: "الأفكار", icon: Lightbulb, color: "group-hover:text-amber-400" },
    { id: "profile", path: `/profile/${currentUser.id}`, label: "ملفي الشخصي", icon: UserCircle, color: "group-hover:text-emerald-400" },
    { id: "comments", path: "/comments", label: "التعليقات", icon: MessageSquare, adminOnly: true, color: "group-hover:text-indigo-400" },
    { id: "content", path: "/content", label: "المحتوى", icon: Library, color: "group-hover:text-orange-400" },
    { id: "philosophy", path: "/philosophy", label: "الفلسفة", icon: BrainCircuit, color: "group-hover:text-purple-400" },
    { id: "quotes", path: "/quotes", label: "العبارات الملهمة", icon: Quote, color: "group-hover:text-pink-400" },
    { id: "skills", path: "/skills", label: "تطوير المهارات", icon: Zap, color: "group-hover:text-sky-400" },
    { 
      id: "suggestions",
      path: "/suggestions", 
      label: "الرسائل والاقتراحات", 
      icon: FileText,
      color: "group-hover:text-teal-400",
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined
    },
    { id: "about", path: "/about", label: "حول التطبيق", icon: HelpCircle, color: "group-hover:text-slate-400" },
  ].filter(item => !isSectionHidden(item.id));

  // Add dynamic sections
  aboutSections.forEach(section => {
    if (section.isProjectInfo) return;
    const mainIds = ["home", "ideas", "profile", "comments", "content", "philosophy", "quotes", "skills", "suggestions", "about"];
    if (mainIds.includes(section.id)) return;
    if (section.hiddenByOwner && !isSuperAdmin) return;

    if (section.isVisible) {
      menuItems.push({
        id: section.id,
        path: `/section/${section.id}`,
        label: section.title,
        icon: Lightbulb,
        color: "group-hover:text-amber-400"
      });
    }
  });

  const adminItems = [
    { path: "/admin", label: "لوحة التحكم", icon: BarChart3, color: "group-hover:text-indigo-400" },
    { path: "/admin/members", label: "الأعضاء", icon: Users, permission: "view_members", color: "group-hover:text-emerald-400" },
    { path: "/admin/messages", label: "الرسائل", icon: Mail, permission: "manage_suggestions", color: "group-hover:text-blue-400" },
    { path: "/admin/notifications", label: "التنبيهات", icon: BellDot, permission: "manage_notifications", color: "group-hover:text-yellow-400" },
    { path: "/admin/sections", label: "الأقسام", icon: FolderTree, permission: "manage_sections", color: "group-hover:text-orange-400" },
    { path: "/admin/comments", label: "التعليقات", icon: MessageSquare, permission: "manage_ideas", color: "group-hover:text-pink-400" },
    { path: "/admin/chat", label: "دردشة المديرين", icon: MessagesSquare, color: "group-hover:text-violet-400" },
    { path: "/admin/audit", label: "سجل النشاطات", icon: History, color: "group-hover:text-amber-400" },
    { path: "/admin/settings", label: "الإعدادات", icon: Settings2, color: "group-hover:text-slate-400" },
  ];

  const handleNav = (path: string) => {
    if (!currentUser) return;
    navigate(path);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
      <aside
        className={`fixed md:relative top-0 right-0 h-full w-64 glass-sidebar bg-[#0a0f1f] border-l border-white/10 z-50 transition-transform duration-300 transform 
                ${isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"} flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-accent" />
            <div>
              <h1 className="text-lg font-bold gradient-text">متحف الفكر</h1>
              <p className="text-[10px] text-gray-400">
                {currentUser.role === "super_admin" ? "👑 مدير رئيسي" : currentUser.role === "admin" ? "👑 مدير" : "👤 زائر"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-auto scrollbar-hide">
          {menuItems.map((item) => {
            if (item.adminOnly && currentUser.role !== "admin" && currentUser.role !== "super_admin") return null;
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all relative
                                    ${
                                      isActive
                                        ? "bg-zinc-800 border-r-4 border-accent text-white"
                                        : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                    }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-accent' : `text-zinc-500 ${item.color}`}`} />
                <span className="font-tajawal text-sm">{item.label}</span>
                {item.badge && (
                  <span className="mr-auto bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          { (currentUser.role === "admin" || currentUser.role === "super_admin") && (
            <>
              <div className="border-t border-white/10 my-4 pt-4">
                <p className="text-xs text-zinc-600 px-4 mb-2 uppercase tracking-wider font-bold">إدارة النظام</p>
              </div>
              {adminItems.map((item) => {
                if (item.permission && currentUser.adminPermissions && !currentUser.adminPermissions.includes(item.permission)) {
                  return null;
                }
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all
                                          ${
                                            isActive
                                              ? "bg-zinc-800 border-r-4 border-accent text-white"
                                              : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                          }`}
                  >
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-accent' : `text-zinc-500 ${item.color}`}`} />
                    <span className="font-tajawal text-sm">{item.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div 
            onClick={() => handleNav(`/profile/${currentUser.id}`)}
            className="glass-card rounded-xl p-3 mb-3 cursor-pointer hover:bg-zinc-800 transition-colors border border-white/5"
          >
            <div className="flex items-center gap-3">
              <UserAvatar user={currentUser} className="w-8 h-8" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate text-white">{currentUser.name}</p>
                <p className="text-[10px] text-zinc-500 truncate lowercase font-mono">
                  {currentUser.role}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
          <div className="mt-4 text-center">
            <p className="text-[10px] text-zinc-700 font-mono">v1.1.0-lucide</p>
          </div>
        </div>
      </aside>
    </>
  );
};
