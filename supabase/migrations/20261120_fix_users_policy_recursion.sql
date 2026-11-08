-- ==============================================================================
-- Migration: 20261120_fix_users_policy_recursion.sql
-- Mục đích: Khắc phục triệt để lỗi "infinite recursion detected in policy for relation users"
--          Chuẩn hóa RLS policies trên bảng public.users & cấu hình bucket storage avatars
-- ==============================================================================

-- 1. BẬT ROW LEVEL SECURITY TRÊN BẢNG PUBLIC.USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. XÓA CÁC POLICY CŨ CÓ NGUY CƠ ĐỆ QUY TRÊN PUBLIC.USERS
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;

-- 3. THIẾT LẬP CHÍNH SÁCH RLS TRỰC TIẾP KHÔNG ĐỆ QUY (SỬ DỤNG AUTH.UID() TRỰC TIẾP)
-- Tuyệt đối không viết subquery "SELECT 1 FROM public.users" bên trong policy của chính bảng users!

CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access to users"
    ON public.users FOR ALL
    USING (
        current_user = 'service_role' 
        OR COALESCE((auth.jwt()->>'role'), '') = 'service_role'
    );

-- 4. HÀM HELPER SECURITY DEFINER ĐỂ KIỂM TRA QUYỀN ADMIN (CHỐNG LẶP VÔ HẠN RLS)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    is_adm BOOLEAN;
BEGIN
    IF current_user = 'service_role' OR COALESCE((auth.jwt()->>'role'), '') = 'service_role' THEN
        RETURN true;
    END IF;
    
    -- Function SECURITY DEFINER chạy với quyền của creator, bỏ qua RLS nên không gây đệ quy
    SELECT (role = 'admin') INTO is_adm
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN COALESCE(is_adm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5. ĐẢM BẢO STORAGE BUCKET 'avatars' ĐÃ KHỞI TẠO VÀ CẤP QUYỀN PUBLIC ĐỌC
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Policies cho bucket 'avatars'
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
