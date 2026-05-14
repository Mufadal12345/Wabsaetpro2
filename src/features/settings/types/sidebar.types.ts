import { LucideIcon } from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badgeKey?: string;
  exact?: boolean;
  superAdminOnly?: boolean;
}

export interface SidebarGroup {
  id: string;
  title?: string;
  items: SidebarItem[];
  showDivider?: boolean;
}
