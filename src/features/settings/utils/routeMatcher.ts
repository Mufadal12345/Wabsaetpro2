import { SidebarGroup } from '../types/sidebar.types';
import { UserRole } from '../types/navigation.types';

export const filterNavByRole = (config: SidebarGroup[], _role: UserRole) => {
  return config.filter(_group => {
    // Basic filtering logic
    return true;
  });
};

export const getActiveState = (pathname: string, path: string, exact?: boolean) => {
  return exact ? pathname === path : pathname.startsWith(path);
};
