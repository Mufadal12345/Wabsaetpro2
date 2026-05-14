import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';
import { IdeaService } from '../services/idea.service';
import { IdeaCreateInput, IdeaUpdateInput, Idea } from '../types/idea.types';
import { useAuth } from '../../auth/hooks/useAuth';

export const useCreateIdea = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (data: IdeaCreateInput) => {
      if (!profile) throw new Error("Must be logged in to create an idea");
      return IdeaService.createIdea(data, profile);
    },
    onMutate: async (newIdeaData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ideas.all });

      // Snapshot the previous value
      const previousIdeas = queryClient.getQueryData(QUERY_KEYS.ideas.all);

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: QUERY_KEYS.ideas.all }, (old: any) => {
        if (!old || !old.pages) return old;
        
        const optimisticIdea: Idea = {
          id: `temp-${Date.now()}`,
          ...newIdeaData,
          author: profile?.name || 'Unknown',
          authorId: profile?.id || 'unknown',
          authorRole: profile?.role || 'user',
          views: 0,
          likes: 0,
          likedBy: [],
          featured: false,
          deleted: false,
          createdAt: new Date().toISOString(),
        };

        const newPages = [...old.pages];
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            ideas: [optimisticIdea, ...newPages[0].ideas]
          };
        }
        return { ...old, pages: newPages };
      });

      return { previousIdeas };
    },
    onError: (_err, _newIdea, context) => {
      if (context?.previousIdeas) {
        queryClient.setQueriesData({ queryKey: QUERY_KEYS.ideas.all }, context.previousIdeas);
      }
    },
    onSettled: () => {
      // Invalidate to refetch the true data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ideas.all });
    },
  });
};

export const useUpdateIdea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: IdeaUpdateInput }) => {
      return IdeaService.updateIdea(id, data);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ideas.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ideas.detail(variables.id) });
    },
  });
};

export const useDeleteIdea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return IdeaService.deleteIdea(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ideas.all });
      const previousIdeas = queryClient.getQueryData(QUERY_KEYS.ideas.all);

      queryClient.setQueriesData({ queryKey: QUERY_KEYS.ideas.all }, (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            ideas: page.ideas.filter((idea: Idea) => idea.id !== id),
          })),
        };
      });

      return { previousIdeas };
    },
    onError: (_err, _id, context) => {
      if (context?.previousIdeas) {
        queryClient.setQueriesData({ queryKey: QUERY_KEYS.ideas.all }, context.previousIdeas);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ideas.all });
    },
  });
};

export const useLikeIdea = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (ideaId: string) => {
      if (!profile) throw new Error("Must be logged in to like");
      return IdeaService.toggleLike(ideaId, profile.id);
    },
    onMutate: async (ideaId) => {
      if (!profile) return;
      
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ideas.all });
      const previousIdeas = queryClient.getQueryData(QUERY_KEYS.ideas.all);

      queryClient.setQueriesData({ queryKey: QUERY_KEYS.ideas.all }, (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            ideas: page.ideas.map((idea: Idea) => {
              if (idea.id === ideaId) {
                const likedBy = idea.likedBy || [];
                const isLiked = likedBy.includes(profile.id);
                return {
                  ...idea,
                  likedBy: isLiked 
                    ? likedBy.filter(id => id !== profile.id)
                    : [...likedBy, profile.id],
                  likes: isLiked ? Math.max(0, idea.likes - 1) : idea.likes + 1
                };
              }
              return idea;
            }),
          })),
        };
      });

      // Optimistically update the detail view if cached
      const previousDetail = queryClient.getQueryData(QUERY_KEYS.ideas.detail(ideaId));
      if (previousDetail) {
        queryClient.setQueryData(QUERY_KEYS.ideas.detail(ideaId), (oldIdea: any) => {
          if (!oldIdea) return oldIdea;
          const likedBy = oldIdea.likedBy || [];
          const isLiked = likedBy.includes(profile.id);
          return {
            ...oldIdea,
            likedBy: isLiked 
              ? likedBy.filter((id: string) => id !== profile.id)
              : [...likedBy, profile.id],
            likes: isLiked ? Math.max(0, oldIdea.likes - 1) : oldIdea.likes + 1
          };
        });
      }

      return { previousIdeas, previousDetail };
    },
    onError: (_err, ideaId, context) => {
      if (context?.previousIdeas) {
        queryClient.setQueriesData({ queryKey: QUERY_KEYS.ideas.all }, context.previousIdeas);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(QUERY_KEYS.ideas.detail(ideaId), context.previousDetail);
      }
    },
    onSettled: (_data, _error, ideaId) => {
      // Invalidate to make sure we're in sync with real values
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ideas.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ideas.detail(ideaId) });
    },
  });
};
