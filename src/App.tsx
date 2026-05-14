import React, { Suspense, lazy, useEffect } from "react";
import { motion } from "framer-motion";
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { AppProviders } from "./app/providers/AppProviders";
import { useAuth } from "./features/auth/hooks/useAuth";
import { AppLayout as LayoutShell } from "../components/layout/AppLayout";
import { Login } from "../pages/Login";
import { Home } from "../pages/Home";
import { Onboarding } from "../components/Onboarding";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SettingsRoutes } from "./features/settings/pages/SettingsRoutes";

// Feature-based code splitting
const Ideas = lazy(() => import("../pages/Ideas").then(m => ({ default: m.Ideas })));
const Visual = lazy(() => import("../pages/Visuals").then(m => ({ default: m.Visuals })));
const Profile = lazy(() => import("../pages/Profile").then(m => ({ default: m.Profile })));
const SearchPage = lazy(() => import("../pages/Search").then(m => ({ default: m.Search })));
const Notifications = lazy(() => import("../pages/Notifications").then(m => ({ default: m.Notifications })));
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard").then(m => ({ default: m.AdminDashboard })));
const Members = lazy(() => import("../pages/admin/Members").then(m => ({ default: m.Members })));
const Messages = lazy(() => import("../pages/admin/Messages").then(m => ({ default: m.Messages })));
const AdminNotifications = lazy(() => import("../pages/admin/AdminNotifications").then(m => ({ default: m.AdminNotifications })));
const AdminSections = lazy(() => import("../pages/admin/AdminSections").then(m => ({ default: m.AdminSections })));
const AdminComments = lazy(() => import("../pages/admin/AdminComments").then(m => ({ default: m.AdminComments })));
const AdminChat = lazy(() => import("../pages/admin/AdminChat").then(m => ({ default: m.AdminChat })));
const AdminAuditLogs = lazy(() => import("../pages/admin/AdminAuditLogs").then(m => ({ default: m.AdminAuditLogs })));
const AdminSettings = lazy(() => import("../pages/admin/AdminSettings").then(m => ({ default: m.AdminSettings })));
const Suggestions = lazy(() => import("../pages/Suggestions").then(m => ({ default: m.Suggestions })));
const About = lazy(() => import("../pages/About").then(m => ({ default: m.About })));
const StoryPage = lazy(() => import("../pages/StoryPage").then(m => ({ default: m.StoryPage })));
const StoriesPage = lazy(() => import("../pages/StoriesPage").then(m => ({ default: m.StoriesPage })));

// HOC for Admin Auth
import { withAdminAuth } from "./shared/hoc/withAdminAuth";

const ProtectedAdminDashboard = withAdminAuth(AdminDashboard);
const ProtectedAdminMembers = withAdminAuth(Members);
const ProtectedAdminMessages = withAdminAuth(Messages);
const ProtectedAdminNotifications = withAdminAuth(AdminNotifications);
const ProtectedAdminSections = withAdminAuth(AdminSections);
const ProtectedAdminComments = withAdminAuth(AdminComments);
const ProtectedAdminChat = withAdminAuth(AdminChat);
const ProtectedAdminAuditLogs = withAdminAuth(AdminAuditLogs);
const ProtectedAdminSettings = withAdminAuth(AdminSettings);

const NativeBackButtonHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let listener: any;
    
    const initListener = async () => {
      try {
        listener = await CapacitorApp.addListener('backButton', () => {
          if (location.pathname === '/' || location.pathname === '/login') {
            CapacitorApp.exitApp();
          } else {
            navigate(-1);
          }
        });
      } catch (err) {
        // App plugin might not be available on web, safely ignore
      }
    };
    
    initListener();
    
    return () => {
      if (listener && listener.remove) {
        listener.remove();
      }
    };
  }, [navigate, location.pathname]);

  return null;
};

const AppContent: React.FC = () => {
  const { profile, loading, isAuthenticating } = useAuth();


  if (loading || isAuthenticating) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-[9999]">
        <div className="w-16 h-16 mb-8 relative">
           <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white font-tajawal text-xl font-bold tracking-widest"
        >
          متحف الفكر
        </motion.h2>
        <p className="text-zinc-500 font-tajawal text-sm mt-4 text-center max-w-xs leading-relaxed animate-pulse">
          {isAuthenticating ? "جاري التحقق من الهوية..." : "جاري تحميل التطبيق..."}
        </p>
      </div>
    );
  }

  // If user is not logged in
  if (!profile) {
    return (
      <>
        <Onboarding />
        <Login />
      </>
    );
  }

  return (
    <LayoutShell>
      <Onboarding />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/visual" element={<Visual />} />
          <Route path="/visuals" element={<Visual />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/story/:userId" element={<StoryPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/settings/*" element={<SettingsRoutes />} />
          
          {/* Admin Routes Protected via HOC */}
          <Route path="/admin" element={<ProtectedAdminDashboard />} />
          <Route path="/admin/members" element={<ProtectedAdminMembers />} />
          <Route path="/admin/messages" element={<ProtectedAdminMessages />} />
          <Route path="/admin/notifications" element={<ProtectedAdminNotifications />} />
          <Route path="/admin/sections" element={<ProtectedAdminSections />} />
          <Route path="/admin/comments" element={<ProtectedAdminComments />} />
          <Route path="/admin/chat" element={<ProtectedAdminChat />} />
          <Route path="/admin/audit" element={<ProtectedAdminAuditLogs />} />
          <Route path="/admin/settings" element={<ProtectedAdminSettings />} />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </LayoutShell>
  );
};

export default function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <NativeBackButtonHandler />
          <AppContent />
        </HashRouter>
      </ErrorBoundary>
    </AppProviders>
  );
}
