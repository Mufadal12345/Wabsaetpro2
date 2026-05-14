import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';
import { IdeaService } from '../services/idea.service';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export const useIdeasQuery = (filters?: { category?: string; query?: string }) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.ideas.list(filters),
    queryFn: async ({ pageParam = null }) => {
      return IdeaService.getIdeas(pageParam as QueryDocumentSnapshot<DocumentData> | null, 10, filters);
    },
    initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.lastVisible : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useVisualFeedQuery = () => {
  return useInfiniteQuery({
    queryKey: ['ideas', 'visual'],
    queryFn: ({ pageParam = null }) => 
      IdeaService.getVisualIdeas(pageParam as QueryDocumentSnapshot<DocumentData> | null),
    initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    staleTime: 1000 * 60 * 5, // 5 دقائق
  });
};

export const useIdeaDetailQuery = (id: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.ideas.detail(id!),
    queryFn: async () => {
      if (!id) return null;
      return IdeaService.getIdeaById(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};
