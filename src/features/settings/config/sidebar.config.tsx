import { Shield, User, Bell, Eye, Paintbrush, Languages, Accessibility, Activity, Clock, Users } from 'lucide-react';
import { SidebarGroup } from '../types/sidebar.types';

export const SIDEBAR_CONFIG: SidebarGroup[] = [
  {
    id: 'account',
    title: 'الحساب',
    items: [
      { id: 'profile', label: 'الملف الشخصي', path: '/settings/account', icon: User },
      { id: 'security', label: 'الأمان', path: '/settings/security', icon: Shield },
      { id: 'sessions', label: 'الجلسات', path: '/settings/sessions', icon: Clock },
    ],
  },
  {
    id: 'preferences',
    title: 'التفضيلات',
    items: [
      { id: 'appearance', label: 'المظهر', path: '/settings/appearance', icon: Paintbrush },
      { id: 'language', label: 'اللغة', path: '/settings/language', icon: Languages },
      { id: 'accessibility', label: 'إمكانية الوصول', path: '/settings/accessibility', icon: Accessibility },
    ],
  },
  {
    id: 'social',
    title: 'النشاط',
    items: [
      { id: 'activity', label: 'النشاط', path: '/settings/activity', icon: Activity, superAdminOnly: true },
      { id: 'notifications', label: 'التنبيهات', path: '/settings/notifications', icon: Bell },
      { id: 'privacy', label: 'الخصوصية', path: '/settings/privacy', icon: Eye },
      { id: 'following', label: 'المتـابعون', path: '/settings/followers', icon: Users },
    ],
    showDivider: true,
  },
];
