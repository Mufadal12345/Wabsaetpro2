import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';
import { CommentService } from '../services/comment.service';
import { CommentCreateInput } from '../types/comment.types';
import { useAuth } from '../../auth/hooks/useAuth';

export const useCommentsQuery = (ideaId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.comments.byIdeaId(ideaId || ''),
    queryFn: async () => {
      if (!ideaId) return [];
      return CommentService.getCommentsByIdeaId(ideaId);
    },
    enabled: !!ideaId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (data: CommentCreateInput) => {
      if (!profile) throw new Error("Must be logged in to comment");
      return CommentService.addComment(data, profile);
    },
    onSuccess: (newComment, variables) => {
      // Setup proper cache invalidation so only the comments for that specific idea refresh
      queryClient.setQueryData(
        QUERY_KEYS.comments.byIdeaId(variables.ideaId),
        (old: any) => {
          if (!old) return [newComment];
          return [...old, newComment];
        }
      );
    },
    onSettled: (_data, _error, variables) => {
      // Invalidate to make sure we fetch the absolute latest ordered list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.comments.byIdeaId(variables.ideaId) });
    }
  });
};

export const useDeleteComment = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: async ({ commentId, ideaId }: { commentId: string, ideaId: string }) => {
        await CommentService.deleteComment(commentId);
        return { commentId, ideaId };
      },
      onSuccess: ({ commentId, ideaId }) => {
        queryClient.setQueryData(
          QUERY_KEYS.comments.byIdeaId(ideaId),
          (old: any) => {
            if (!old) return old;
            // Depending on implementation, we either remove it from array or mark it deleted
            return old.map((c: any) => c.id === commentId ? { ...c, deleted: true } : c);
          }
        );
      },
      onSettled: (_data, _error, variables) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.comments.byIdeaId(variables.ideaId) });
      }
    });
};
