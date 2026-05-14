import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '../../../../firebase';
import { AuthState } from '../types/auth.types';
import { AuthService } from '../services/auth.service';
import { useUserProfileQuery } from '../queries/auth.queries';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';

export const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  isAuthenticating: false,
  setIsAuthenticating: () => {},
  error: null,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const queryClient = useQueryClient();

  // Load the firestore profile automatically if we have a uid
  const { 
    data: profile, 
    isLoading: isProfileLoading, 
    error: profileError 
  } = useUserProfileQuery(firebaseUser?.uid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        
        // Asynchronously sync the user to firestore
        // This ensures the custom role rules apply properly and lastLogin is updated
        try {
          const syncedProfile = await AuthService.syncUserToFirestore(user);
          // Manually seed the query cache with the returned synced profile
          await queryClient.cancelQueries({ queryKey: QUERY_KEYS.users.currentUser() });
          queryClient.setQueryData(QUERY_KEYS.users.currentUser(), syncedProfile);
        } catch (err) {
          console.error('Failed to sync user to Firestore:', err);
        } finally {
          setAuthInitialized(true);
        }
      } else {
        setFirebaseUser(null);
        queryClient.setQueryData(QUERY_KEYS.users.currentUser(), null);
        
        // Clean up legacy localStorage item if it exists
        localStorage.removeItem('user');
        
        setAuthInitialized(true);
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const value: AuthState = {
    user: firebaseUser,
    profile: profile || null,
    loading: !authInitialized || (!!firebaseUser && isProfileLoading),
    isAuthenticating,
    setIsAuthenticating,
    error: profileError ? (profileError as Error).message : null,
  };

  // We expose isAuthenticating setter via a internal mechanism or just use context
  // but since we want useAuth to use it, we can pass it in value.
  // Wait, AuthState doesn't have setIsAuthenticating.
  // I'll add a helper to AuthContextType if I had one.
  // For now I'll just use the context to manage it.

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
