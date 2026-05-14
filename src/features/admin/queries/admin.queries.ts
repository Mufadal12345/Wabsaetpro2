import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';
import { AdminService } from '../services/admin.service';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export const useUsersManagementQuery = () => {
    return useInfiniteQuery({
        queryKey: QUERY_KEYS.users.all,
        queryFn: async ({ pageParam = null }) => {
            return AdminService.getAllUsers(pageParam as QueryDocumentSnapshot<DocumentData> | null, 20);
        },
        initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
        getNextPageParam: (lastPage) => {
            return lastPage?.hasMore ? lastPage.lastVisible : undefined;
        },
        staleTime: 1000 * 60 * 5,
    });
};

export const useSystemStatsQuery = () => {
    return useQuery({
        queryKey: ['admin', 'systemStats'],
        queryFn: () => AdminService.getSystemStats(),
        staleTime: 1000 * 30, // 30 seconds for near real-time monitoring
    });
};
