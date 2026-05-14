import { supabase } from "../supabase";

/**
 * خدمة لرفع الملفات إلى Supabase Storage
 */
export const uploadProfileImage = async (userId: string, file: File) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    // رفع الملف
    const { error: uploadError } = await supabase
      .storage
      .from('profiles') // تأكد من إنشاء Bucket باسم 'profiles' في Supabase
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // الحصول على الرابط العام
    const { data: publicUrlData } = supabase
      .storage
      .from('profiles')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
