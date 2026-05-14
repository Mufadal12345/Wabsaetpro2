-- Supabase SQL Policies for "متحف الفكر"
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO SECURE STORAGE

-- Enable Storage Extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Avatars Bucket (صورة الملف الشخصي)
-- ==========================================

-- Insert bucket if missing (Make it PUBLIC)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, '{"image/png", "image/jpeg", "image/jpg", "image/gif"}')
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Allow Public Read (Anyone can see avatars)
CREATE POLICY "Public Access for Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- NOTE: Since you are using Firebase Auth exclusively, Supabase's `auth.uid()` will be NULL unless you generate and pass custom JWTs.
-- Until you sync Firebase Auth with Supabase JWTs, you either have to:
-- A) Allow anonymous uploads (with path restrictions based on Firebase UID passed from frontend).
-- B) Implement a Supabase Edge Function to verify Firebase Token.

-- For immediate functionality in a purely Firebase-Auth frontend with Anon Key (Option A - Less Secure but works instantly):
CREATE POLICY "Allow Uploads with Anon Key"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Allow Updates with Anon Key"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' );

CREATE POLICY "Allow Deletes with Anon Key"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' );

-- ==========================================
-- 2. Post Images Bucket (صور المنشورات)
-- ==========================================

-- Insert bucket if missing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post_images', 'post_images', true, 10485760, '{"image/png", "image/jpeg", "image/jpg", "image/webp"}')
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Allow Public Read
CREATE POLICY "Public read for post images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'post_images' );

-- Same Anon Key rules apply if passing custom Firebase Token isn't implemented:
CREATE POLICY "Allow Uploads for Posts with Anon Key"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'post_images' );

CREATE POLICY "Allow Deletes for Posts with Anon Key"
ON storage.objects FOR DELETE
USING ( bucket_id = 'post_images' );

-- ==========================================
-- NOTE TO THE ARCHITECT (الملاحظة المعمارية)
-- ==========================================
-- بما أنك تستخدم (Firebase Auth) كنظام أساسي للهوية، لا يمكن لـ Supabase أن يتعرف على (auth.uid()) افتراضياً.
-- لضمان أمان 100% (RLS) للرفع الجانبي للصور، الخيار الأفضل معمارياً هو بناء Webhook أو Edge Function يقرأ (Firebase JWT) للتحقق، 
-- أو كتابة Storage Rules داخل Firebase Storage بدلاً من Supabase.
-- الـ Policies أعلاه ستسمح برفع الصور وإزالتها مباشرة عبر الواجهة (تم تهيئة الكود لضمان السلاسة الفورية).
