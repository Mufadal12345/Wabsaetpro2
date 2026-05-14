import React, { useEffect } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';

export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>, 
  requireSuperAdmin: boolean = false
) {
  return function WithAdminAuth(props: P) {
    const { profile, loading } = useAuth();

    useEffect(() => {
      if (!loading) {
        if (!profile) {
          window.location.href = '/';
        } else {
          const isAllowed = requireSuperAdmin 
            ? profile.role === 'super_admin'
            : (profile.role === 'admin' || profile.role === 'super_admin');
            
          if (!isAllowed) {
            window.location.href = '/';
          }
        }
      }
    }, [profile, loading, requireSuperAdmin]);

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
        </div>
      );
    }

    const isAllowed = requireSuperAdmin 
        ? profile?.role === 'super_admin'
        : (profile?.role === 'admin' || profile?.role === 'super_admin');

    if (!isAllowed) {
      return null; // Will be redirected by useEffect
    }

    return <WrappedComponent {...props} />;
  };
}
