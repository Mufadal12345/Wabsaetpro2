import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';
import { AdminService } from '../services/admin.service';
import { useAuth } from '../../auth/hooks/useAuth';
import { UserRole } from '../../auth/types/auth.types';

export const useBanUserMutation = () => {
    const queryClient = useQueryClient();
    const { profile } = useAuth();
    
    return useMutation({
        mutationFn: async ({ targetUserId, isBanned, reason }: { targetUserId: string, isBanned: boolean, reason?: string }) => {
            if (!profile) throw new Error("Not logged in");
            await AdminService.banUser(profile, targetUserId, isBanned, reason);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auditLogs.all });
        }
    });
};

export const useChangeRoleMutation = () => {
    const queryClient = useQueryClient();
    const { profile } = useAuth();
    
    return useMutation({
        mutationFn: async ({ targetUserId, newRole }: { targetUserId: string, newRole: UserRole }) => {
            if (!profile) throw new Error("Not logged in");
            await AdminService.updateUserRole(profile, targetUserId, newRole);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auditLogs.all });
        }
    });
};

export const useAdminDeleteIdeaMutation = () => {
    const queryClient = useQueryClient();
    const { profile } = useAuth();

    return useMutation({
        mutationFn: async (ideaId: string) => {
            if (!profile) throw new Error("Not logged in");
            await AdminService.deleteIdeaByAdmin(profile, ideaId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ideas.all });
            queryClient.invalidateQueries({ queryKey: ['admin', 'systemStats'] });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auditLogs.all });
        }
    });
};
