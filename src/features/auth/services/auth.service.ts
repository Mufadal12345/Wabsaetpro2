import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  browserLocalPersistence,
  setPersistence,
  updateProfile,
  signInWithCredential
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { supabase } from '../../../../supabase'; // Relative path to supabase client
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../../firebase';
import { FirestoreService } from '../../../services/firebase/firebase.service';
import { UserProfile } from '../types/auth.types';

const googleProvider = new GoogleAuthProvider();

// Initialize GoogleAuth for native
if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize();
}

export const AuthService = {
  async updateProfileImage(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const downloadURL = data.publicUrl;
      
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { photoURL: downloadURL });
      
      return downloadURL;
    } catch (error) {
      console.error("Error updating profile image:", error);
      throw error;
    }
  },

  async signInWithGoogle(): Promise<FirebaseUser> {
    try {
      const platform = Capacitor.getPlatform();
      console.log(`[AuthService] Starting Google Login on platform: ${platform}`);

      if (Capacitor.isNativePlatform()) {
        const nativeUser = await GoogleAuth.signIn();
        if (!nativeUser.authentication.idToken) {
          throw new Error('فشل الحصول على رمز الهوية من جوجل');
        }
        
        const credential = GoogleAuthProvider.credential(nativeUser.authentication.idToken);
        const result = await signInWithCredential(auth, credential);
        return result.user;
      } else {
        // Web flow
        await setPersistence(auth, browserLocalPersistence);
        
        // Use popup for better UX on desktop, consider redirect for mobile browsers if needed
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
    } catch (error: any) {
      // Handle specific errors
      if (error.code === 'auth/popup-closed-by-user' || error.code === '12501' || error.message?.includes('cancelled')) {
        throw new Error('تم إلغاء عملية تسجيل الدخول');
      }

      console.error("[AuthService] Google Sign-In Error:", error);

      if (error.code === '12500') {
        throw new Error('حدث خطأ في خدمات جوجل، يرجى المحاولة لاحقاً');
      }
      
      throw error;
    }
  },

  async signOut(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.signOut();
      } catch (e) {
        console.warn("Native Google Sign-Out error:", e);
      }
    }
    await firebaseSignOut(auth);
  },

  async logout(queryClient?: any): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.signOut();
      } catch (e) {
        console.warn("Native Google Sign-Out error:", e);
      }
    }
    await firebaseSignOut(auth);
    if (queryClient) {
      queryClient.clear();
    }
    // Wipe memory by fully reloading and redirecting to root
    window.location.replace('/');
  },

  async reauthenticate(password: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('User not logged in');
    
    const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  },

  async updateEmail(newEmail: string): Promise<void> {
    if (auth.currentUser) {
      const { updateEmail: firebaseUpdateEmail } = await import('firebase/auth');
      await firebaseUpdateEmail(auth.currentUser, newEmail);
      await FirestoreService.updateDocument('users', auth.currentUser.uid, { email: newEmail });
    }
  },

  async updatePassword(newPassword: string): Promise<void> {
    if (auth.currentUser) {
      const { updatePassword: firebaseUpdatePassword } = await import('firebase/auth');
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    }
  },

  async getCurrentUserProfile(uid: string): Promise<UserProfile | null> {
    return FirestoreService.getDocument<UserProfile>('users', uid);
  },

  async login(email: string, pass: string): Promise<FirebaseUser> {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  },

  async signup(email: string, pass: string, name: string): Promise<FirebaseUser> {
    const { createUserWithEmailAndPassword, updateProfile: firebaseUpdateProfile } = await import('firebase/auth');
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    await firebaseUpdateProfile(userCred.user, { displayName: name });
    return userCred.user;
  },

  async syncUserToFirestore(user: FirebaseUser): Promise<UserProfile> {
    const existingProfile = await this.getCurrentUserProfile(user.uid);
    
    // Create new profile if it doesn't exist
    if (!existingProfile) {
      const newProfile: Omit<UserProfile, 'id'> = {
        name: user.displayName || 'مستخدم جديد',
        email: user.email || '',
        specialty: 'غير محدد',
        role: 'user', // Firestore rules mandate role == 'user' on creation
        isBanned: false,
        authMethod: user.providerData[0]?.providerId || 'unknown',
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      await FirestoreService.setDocument('users', user.uid, newProfile);
      return { id: user.uid, ...newProfile };
    }

    // Update fields for existing user
    const updates: Partial<UserProfile> = {
      lastLogin: new Date().toISOString(),
      emailVerified: user.emailVerified,
    };
    if (user.photoURL && user.photoURL !== existingProfile.photoURL) {
      updates.photoURL = user.photoURL;
    }
    
    await FirestoreService.updateDocument('users', user.uid, updates);
    return { ...existingProfile, ...updates };
  }
};
