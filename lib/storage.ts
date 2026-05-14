import { supabase } from '../supabase';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

/**
 * دالة لرفع الصورة المقتصة ومزامنتها مع Firebase
 */
export const uploadAndSyncAvatar = async (uid: string, imageBlob: Blob) => {
  const filePath = `${uid}/profile.webp`;

  // 1. الرفع إلى Supabase Storage (استبدال إذا وجدت)
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, imageBlob, {
      contentType: 'image/webp',
      upsert: true
    });

  if (uploadError) throw uploadError;

  // 2. جلب رابط الصورة العام
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const publicUrlWithCacheBuster = `${publicUrl}?v=${Date.now()}`;

  // 3. تحديث ملف المستخدم في Firebase Auth
  if (auth.currentUser && auth.currentUser.uid === uid) {
    await updateProfile(auth.currentUser, { photoURL: publicUrlWithCacheBuster });
  }

  // 4. تحديث مستند المستخدم في Firestore (avatar_url & photoURL)
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    photoURL: publicUrlWithCacheBuster,
    avatar_url: publicUrlWithCacheBuster,
    updatedAt: new Date().toISOString()
  });

  return publicUrlWithCacheBuster;
};
