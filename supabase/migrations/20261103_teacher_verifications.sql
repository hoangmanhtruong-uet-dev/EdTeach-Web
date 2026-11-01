-- ==============================================================================
-- Migration: 20261103_teacher_verifications.sql
-- Mục tiêu Sprint 3: Teacher eKYC Verification & Tích Xanh Sư Phạm Chính Chủ
-- ==============================================================================

-- 1. TẠO BẢNG TEACHER_VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.teacher_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL DEFAULT 'teacher_card' CHECK (document_type IN ('teacher_card', 'student_card', 'degree_certificate', 'center_card')),
    image_url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending_review' CHECK (status IN ('approved', 'rejected', 'pending_review')),
    
    -- Dữ liệu do AI Vision OCR bóc tách
    ocr_extracted_name TEXT,
    ocr_extracted_school TEXT,
    ocr_extracted_code TEXT,
    ocr_confidence NUMERIC(4, 2),
    role_category VARCHAR(30) DEFAULT 'teacher' CHECK (role_category IN ('teacher', 'tutor', 'center_lecturer')),
    
    -- Kiểm duyệt thủ công (nếu cần)
    admin_reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. INDEXES TĂNG TỐC TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_teacher_verifications_user_id ON public.teacher_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_verifications_status ON public.teacher_verifications(status);
CREATE INDEX IF NOT EXISTS idx_teacher_verifications_created_at ON public.teacher_verifications(created_at DESC);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.teacher_verifications ENABLE ROW LEVEL SECURITY;

-- Giáo viên xem hồ sơ xác thực của chính mình
DROP POLICY IF EXISTS "Users can view own verification record" ON public.teacher_verifications;
CREATE POLICY "Users can view own verification record"
    ON public.teacher_verifications FOR SELECT
    USING (auth.uid() = user_id);

-- Giáo viên gửi hồ sơ xác thực của chính mình
DROP POLICY IF EXISTS "Users can insert own verification" ON public.teacher_verifications;
CREATE POLICY "Users can insert own verification"
    ON public.teacher_verifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin toàn quyền xem và cập nhật hồ sơ xác thực
DROP POLICY IF EXISTS "Admins have full access to verifications" ON public.teacher_verifications;
CREATE POLICY "Admins have full access to verifications"
    ON public.teacher_verifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- 4. FUNCTION TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_teacher_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_teacher_verifications_updated_at ON public.teacher_verifications;
CREATE TRIGGER trigger_teacher_verifications_updated_at
    BEFORE UPDATE ON public.teacher_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_teacher_verifications_updated_at();
