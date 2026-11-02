-- ==============================================================================
-- Migration: 20261115_storage_buckets_setup.sql
-- Mục đích: Khởi tạo các Storage Buckets cần thiết và thiết lập RLS Storage Policies
-- ==============================================================================

-- 1. BUCKET: avatars (Public - Ảnh đại diện của Giáo viên & Học sinh)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. BUCKET: verification_docs (Private - Hồ sơ KYC / Thẻ SV / CCCD)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification_docs',
  'verification_docs',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 3. BUCKET: exam_attachments (Public - Đính kèm đề thi, hình vẽ hình học, file nghe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam_attachments',
  'exam_attachments',
  true,
  20971520, -- 20 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'audio/mpeg', 'audio/wav', 'audio/mp3']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'audio/mpeg', 'audio/wav', 'audio/mp3'];


-- ==============================================================================
-- THIẾT LẬP ROW LEVEL SECURITY (RLS) POLICIES CHO STORAGE.OBJECTS
-- ==============================================================================

-- A. Policies cho bucket 'avatars'
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);


-- B. Policies cho bucket 'verification_docs' (Chủ sở hữu & Admin)
DROP POLICY IF EXISTS "Users can upload their own KYC docs" ON storage.objects;
CREATE POLICY "Users can upload their own KYC docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification_docs' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users and Admins can view KYC docs" ON storage.objects;
CREATE POLICY "Users and Admins can view KYC docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification_docs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid() AND (public.users.role = 'admin' OR public.users.email = 'truongcri0101@gmail.com')
    )
  )
);


-- C. Policies cho bucket 'exam_attachments'
DROP POLICY IF EXISTS "Public can view exam attachments" ON storage.objects;
CREATE POLICY "Public can view exam attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'exam_attachments');

DROP POLICY IF EXISTS "Authenticated users can upload exam attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload exam attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exam_attachments');
