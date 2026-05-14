import { User as FirebaseUser } from 'firebase/auth';

export type UserRole = "super_admin" | "admin" | "user";

export interface UserProfile {
  id: string; // Synced with Firebase Auth UID
  name: string;
  email: string;
  specialty: string;
  role: UserRole;
  isBanned: boolean;
  banUntil?: string; // ISO string
  banReason?: string;
  authMethod: string;
  emailVerified: boolean;
  photoURL?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  adminPermissions?: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticating: boolean;
  setIsAuthenticating: (val: boolean) => void;
  error: string | null;
}
