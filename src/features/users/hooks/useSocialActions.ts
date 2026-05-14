import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';
import { SocialService } from '../services/social.service';
import { useAuth } from '../../auth/hooks/useAuth';

export const useFollowMutation = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!profile) throw new Error("You must be logged in to follow");
      await SocialService.followUser(profile.id, targetUserId);
      return targetUserId;
    },
    onMutate: async (targetUserId) => {
      if (!profile) return;

      const mySocialKey = QUERY_KEYS.socialRelation.detail(profile.id);
      const targetSocialKey = QUERY_KEYS.socialRelation.detail(targetUserId);

      await queryClient.cancelQueries({ queryKey: mySocialKey });
      await queryClient.cancelQueries({ queryKey: targetSocialKey });

      const previousMySocial = queryClient.getQueryData(mySocialKey);
      const previousTargetSocial = queryClient.getQueryData(targetSocialKey);

      // Optimistically update my following list
      queryClient.setQueryData(mySocialKey, (old: any) => {
        if (!old) return { following: [targetUserId], followers: [] };
        return {
          ...old,
          following: [...(old.following || []), targetUserId],
        };
      });

      // Optimistically update target's followers list
      queryClient.setQueryData(targetSocialKey, (old: any) => {
        if (!old) return { following: [], followers: [profile.id] };
        return {
          ...old,
          followers: [...(old.followers || []), profile.id],
        };
      });

      return { previousMySocial, previousTargetSocial, mySocialKey, targetSocialKey };
    },
    onError: (_err, _targetUserId, context) => {
      if (context?.previousMySocial) {
        queryClient.setQueryData(context.mySocialKey, context.previousMySocial);
      }
      if (context?.previousTargetSocial) {
        queryClient.setQueryData(context.targetSocialKey, context.previousTargetSocial);
      }
    },
    onSettled: (_data, _error, targetUserId) => {
      if (!profile) return;
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.socialRelation.detail(profile.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.socialRelation.detail(targetUserId) });
      // We might also need to invalidate the actual user profile to update follower counts
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all }); // or detail profile
    }
  });
};

export const useUnfollowMutation = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!profile) throw new Error("You must be logged in to unfollow");
      await SocialService.unfollowUser(profile.id, targetUserId);
      return targetUserId;
    },
    onMutate: async (targetUserId) => {
      if (!profile) return;

      const mySocialKey = QUERY_KEYS.socialRelation.detail(profile.id);
      const targetSocialKey = QUERY_KEYS.socialRelation.detail(targetUserId);

      await queryClient.cancelQueries({ queryKey: mySocialKey });
      await queryClient.cancelQueries({ queryKey: targetSocialKey });

      const previousMySocial = queryClient.getQueryData(mySocialKey);
      const previousTargetSocial = queryClient.getQueryData(targetSocialKey);

      // Optimistically update my following list
      queryClient.setQueryData(mySocialKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          following: (old.following || []).filter((id: string) => id !== targetUserId),
        };
      });

      // Optimistically update target's followers list
      queryClient.setQueryData(targetSocialKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          followers: (old.followers || []).filter((id: string) => id !== profile.id),
        };
      });

      return { previousMySocial, previousTargetSocial, mySocialKey, targetSocialKey };
    },
    onError: (_err, _targetUserId, context) => {
      if (context?.previousMySocial) {
        queryClient.setQueryData(context.mySocialKey, context.previousMySocial);
      }
      if (context?.previousTargetSocial) {
        queryClient.setQueryData(context.targetSocialKey, context.previousTargetSocial);
      }
    },
    onSettled: (_data, _error, targetUserId) => {
      if (!profile) return;
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.socialRelation.detail(profile.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.socialRelation.detail(targetUserId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
    }
  });
};
