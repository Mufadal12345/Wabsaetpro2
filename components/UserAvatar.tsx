import React from 'react';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

interface UserAvatarProps {
  user: {
    id: string;
    name: string;
    photoURL?: string;
  };
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, className = "w-10 h-10" }) => {
  // If user has a photoURL (e.g., from Google), use it.
  if (user.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.name}
        className={`${className} rounded-full object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Otherwise, generate a deterministic avatar based on user ID
  const avatar = createAvatar(adventurer, {
    seed: user.id,
    // ... options
  });

  const svg = avatar.toDataUri();

  return (
    <img
      src={svg}
      alt={user.name}
      className={`${className} rounded-full bg-white/10`}
    />
  );
};
