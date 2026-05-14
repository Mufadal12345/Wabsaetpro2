import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserAvatarProps {
  user: {
    id: string;
    name: string;
    photoURL?: string | null;
  };
  className?: string;
  onClick?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, className = "w-10 h-10", onClick }) => {
  const [imageError, setImageError] = useState(false);
  const { currentUser } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // If this avatar belongs to the current user, use their up-to-date photoURL from AuthContext
  const activePhotoURL = (currentUser && currentUser.id === user.id && currentUser.photoURL) 
    ? currentUser.photoURL 
    : user.photoURL;

  const hasPhoto = activePhotoURL && !imageError;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-zinc-900 border border-white/5 overflow-hidden transition-transform duration-300 hover:scale-[1.02] active:scale-95 ${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ aspectRatio: '1/1' }}
    >
      {hasPhoto ? (
        <img
          src={activePhotoURL as string}
          alt={user.name}
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-white font-bold select-none" style={{ fontSize: 'calc(40% + 4px)' }}>
          {getInitials(user.name)}
        </span>
      )}
    </div>
  );
};
