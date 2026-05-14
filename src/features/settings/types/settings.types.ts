export interface UserSettings {
  id: string;
  userId: string;
  account: {
    username?: string;
    bio?: string;
    email?: string;
  };
  privacy: {
    accountVisibility: 'public' | 'private';
    profileDiscoverability: boolean;
    activityVisibility: 'everyone' | 'friends' | 'none';
    dmPermissions: 'everyone' | 'friends' | 'none';
  };
  security: {
    mfaEnabled: boolean;
  };
  notifications: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    inAppEnabled: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontScale: number;
  };
  language: string;
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
  };
}
