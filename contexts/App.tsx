import React, { useState, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { App as CapacitorApp } from '@capacitor/app';
import { AuthProvider, useAuth } from "./AuthContext";
import { DataProvider, useData } from "./DataContext";
import { ToastProvider } from "./ToastContext";
import { Sidebar } from "../components/Sidebar";
import { Building2 } from "lucide-react";
import { Login } from "../pages/Login";
import { Home } from "../pages/Home";
import { Ideas } from "../pages/Ideas";
import { Skills } from "../pages/Skills";
import { Quotes } from "../pages/Quotes";
import { Suggestions } from "../pages/Suggestions";
import { Content } from "../pages/Content";
import { Philosophy } from "../pages/Philosophy";
import { About } from "../pages/About";
import { SectionView } from "../pages/SectionView";
import { Profile } from "../pages/Profile";
import { AdminDashboard } from "../pages/admin/Dashboard";
import { Members } from "../pages/admin/Members";
import { AdminComments } from "../pages/admin/AdminComments";
import { Messages } from "../pages/admin/Messages";
import { AdminNotifications } from "../pages/admin/AdminNotifications";
import { AdminSections } from "../pages/admin/AdminSections";
import { AdminChat } from "../pages/admin/AdminChat";
import { AdminSettings } from "../pages/Settings";
import { AdminAuditLogs } from "../pages/admin/AdminAuditLogs";
import { Icons } from "../components/Icons";
import { Onboarding } from "../components/Onboarding";
import { LevelManager } from "../components/LevelManager";
import { calculateUserLevel, LevelInfo } from "../data/levels";
import { LevelUpModal } from "../components/LevelUpModal";
import { Browser } from "@capacitor/browser";

const AppLayout: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { notifications, ideas } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [closedNotifications, setClosedNotifications] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("muf_closed_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [manualLevelUp, setManualLevelUp] = useState<LevelInfo | null>(null);
  const navigate = useNavigate();

  const handleCloseNotification = (e: React.MouseEvent, id: string) => {
    e?.stopPropagation?.();
    if (typeof id !== 'string') {
      console.warn('handleCloseNotification received non-string ID', id);
      return;
    }
    setClosedNotifications(prev => {
      const arr = prev.includes(id) ? prev : [...prev, id];
      try {
        localStorage.setItem("muf_closed_notifications", JSON.stringify(arr));
      } catch (e) {
        console.error("Localstorage save error", e);
      }
      return arr;
    });
  };

  useEffect(() => {
    // Capacitor hardware back button handler
    const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        navigate(-1);
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [navigate]);

  const activeNotifications = notifications.filter(n => n.active && !closedNotifications.includes(n.id));

  const handleNotificationAction = async (n: any) => {
    if (n.actionType === "link" && n.actionLink) {
      if (n.actionLink.startsWith("http")) {
        await Browser.open({ url: n.actionLink });
      } else {
        navigate(n.actionLink);
      }
    } else if (n.actionType === "level_up") {
      if (currentUser) {
        const userIdeasCount = ideas.filter(i => i.authorId === currentUser.id && !i.deleted).length;
        setManualLevelUp(calculateUserLevel(userIdeasCount));
      }
    }
  };

  if (loading)
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0f1f]">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (!currentUser) return (
    <>
      <Onboarding />
      <Login />
    </>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row overflow-hidden bg-[#0a0f1f]">
      <Onboarding />
      <LevelManager />
      {/* Mobile Header */}
      <header className="flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-40 sticky top-0 pt-[env(safe-area-inset-top,1rem)] md:hidden">
        <div className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-accent" />
          <h1 className="text-lg font-bold gradient-text">متحف الفكر</h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
        >
          <Icons.Menu className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* Desktop Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden md:flex fixed top-4 left-4 z-50 w-12 h-12 rounded-full bg-white/10 border border-white/20 items-center justify-center text-white shadow-lg active:scale-95 transition-all hover:bg-white/20 opacity-100"
      >
        <Icons.Menu className="w-6 h-6 text-white" />
      </button>

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <main
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
      >
        {manualLevelUp && (
          <LevelUpModal levelInfo={manualLevelUp} onClose={() => setManualLevelUp(null)} />
        )}
        {/* Global Notifications */}
        <div className="fixed top-20 right-4 left-4 md:left-auto md:right-8 z-[60] flex flex-col gap-3 max-w-md pointer-events-none">
          {activeNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationAction(n)}
              className={`pointer-events-auto glass-card p-4 rounded-2xl border-r-4 shadow-2xl animate-slide-in ${n.actionType && n.actionType !== 'none' ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''} ${
                n.type === "info" ? "border-blue-500" :
                n.type === "warning" ? "border-yellow-500" :
                n.type === "error" ? "border-red-500" : "border-green-500"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-sm mb-1">{n.title}</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">{n.content}</p>
                  {n.actionType === "link" && n.actionText && (
                    <div className="mt-2 text-xs font-bold text-blue-400 flex items-center gap-1">
                      {n.actionText} <Icons.ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                  {n.actionType === "level_up" && (
                    <div className="mt-2 text-xs font-bold text-yellow-400 flex items-center gap-1">
                      عرض تفاصيل الترقية <Icons.ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => handleCloseNotification(e, n.id)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-12 md:py-20 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ideas" element={<Ideas />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/suggestions" element={<Suggestions />} />
              <Route path="/content" element={<Content />} />
              <Route path="/philosophy" element={<Philosophy />} />
              <Route path="/about" element={<About />} />
              <Route path="/section/:id" element={<SectionView />} />
              <Route path="/profile/:userId" element={<Profile />} />

              {/* Admin Routes */}
              <Route
                path="/comments"
                element={
                  (currentUser.role === "admin" || currentUser.role === "super_admin") ? (
                    <AdminComments />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/admin"
                element={
                  (currentUser.role === "admin" || currentUser.role === "super_admin") ? (
                    <AdminDashboard />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/admin/members"
                element={
                  (currentUser.role === "admin" || currentUser.role === "super_admin") ? (
                    <Members />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/admin/messages"
                element={
                  (currentUser.role === "admin" || currentUser.role === "super_admin") ? (
                    <Messages />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  (currentUser.role === "admin" || currentUser.role === "super_admin") ? (
                    <AdminNotifications />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/admin/sections"
                element={
                  (currentUser.role === "admin" || currentUser.role === "super_admin") ? (
                    <AdminSections />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/admin/chat"
                element={
                  (currentUser.role === "super_admin" || (currentUser.role === "admin" && calculateUserLevel(ideas.filter(i => i.authorId === currentUser.id && !i.deleted).length).level >= 5)) ? (
                    <AdminChat />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/admin/settings"
                element={
                  (currentUser.role === "admin" || currentUser.role === "super_admin") ? (
                    <AdminSettings />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/admin/audit"
                element={
                  (currentUser.role === "admin" || currentUser.role === "super_admin") ? (
                    <AdminAuditLogs />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
    </div>
  );
};

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
              <AppLayout />
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </HashRouter>
    </QueryClientProvider>
  );
}
