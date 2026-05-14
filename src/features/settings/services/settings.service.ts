import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { UserSettings } from '../types/settings.types';

export const SettingsService = {
  async getSettings(userId: string): Promise<UserSettings | null> {
    const docRef = doc(db, 'userSettings', userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as UserSettings;
  },

  async updateSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    const docRef = doc(db, 'userSettings', userId);
    await updateDoc(docRef, settings as any);
  }
};
