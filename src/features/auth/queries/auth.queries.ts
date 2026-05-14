import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';
import { AuthService } from '../services/auth.service';

export const useUserProfileQuery = (uid: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.users.currentUser(),
    queryFn: async () => {
      if (!uid) return null;
      return AuthService.getCurrentUserProfile(uid);
    },
    enabled: !!uid,
    staleTime: 1000 * 60 * 60, // Profile rarely changes on its own, keep stale for 1 hr
  });
};
