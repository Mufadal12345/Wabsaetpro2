import { useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { AuthService } from '../services/auth.service';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const queryClient = useQueryClient();
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { setIsAuthenticating, ...contextState } = context;

  const signInWithGoogle = async () => {
    try {
      setIsAuthenticating(true);
      return await AuthService.signInWithGoogle();
    } finally {
      setIsAuthenticating(false);
    }
  };

  return {
    ...contextState,
    signInWithGoogle,
    login: AuthService.login,
    signup: AuthService.signup,
    signOut: AuthService.signOut,
    logout: () => AuthService.logout(queryClient),
  };
};

export const useUpdateProfileImage = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: (file: File) => {
      if (!profile) throw new Error("No profile found");
      return AuthService.updateProfileImage(profile.id, file);
    },
    onSuccess: (newPhotoURL) => {
      queryClient.setQueryData(QUERY_KEYS.users.currentUser(), (old: any) => ({
        ...old,
        photoURL: newPhotoURL
      }));
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.currentUser() });
    }
  });
};
