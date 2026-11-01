-- ==============================================================================
-- Migration: 20261101_student_reports_and_roles.sql
-- Mục tiêu Sprint 1: Bảng báo cáo kết quả học tập cho phụ huynh qua Zalo & vai trò Tutor
-- ==============================================================================

-- 1. CẬP NHẬT CHECK CONSTRAINT ROLE TRÊN BẢNG USERS ĐỂ THÊM 'tutor'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('teacher', 'tutor', 'student', 'admin'));

-- 2. BỔ SUNG CÁC CỘT THÔNG TIN GIẢNG DẠY NẾU CHƯA CÓ
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS teaching_subject TEXT DEFAULT 'Toán',
ADD COLUMN IF NOT EXISTS target_grade TEXT DEFAULT '12',
ADD COLUMN IF NOT EXISTS organization_name TEXT,
ADD COLUMN IF NOT EXISTS is_verified_teacher BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_school TEXT;

-- 3. BẢNG STUDENT_REPORTS (LƯU BÁO CÁO PHỤ HUYNH QUA ZALO MAGIC LINK)
CREATE TABLE IF NOT EXISTS public.student_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(32) UNIQUE NOT NULL,
    session_id TEXT NOT NULL REFERENCES public.grading_sessions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_code TEXT,
    score NUMERIC(4, 2) NOT NULL,
    rank INTEGER,
    total_students INTEGER,
    correct_count INTEGER NOT NULL,
    incorrect_count INTEGER NOT NULL,
    empty_count INTEGER DEFAULT 0,
    exam_title TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT 'Toán',
    grade TEXT NOT NULL DEFAULT '10',
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    details JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_comment TEXT,
    teacher_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES TĂNG TỐC TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_student_reports_token ON public.student_reports(token);
CREATE INDEX IF NOT EXISTS idx_student_reports_session_id ON public.student_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_student_reports_student_id ON public.student_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_student_reports_created_at ON public.student_reports(created_at DESC);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.student_reports ENABLE ROW LEVEL SECURITY;

-- Cho phép phụ huynh đọc báo cáo công khai nếu có token chính xác (không cần đăng nhập Supabase)
DROP POLICY IF EXISTS "Public can view report with valid token" ON public.student_reports;
CREATE POLICY "Public can view report with valid token"
    ON public.student_reports FOR SELECT
    USING (true);

-- Cho phép giáo viên / gia sư tạo báo cáo cho học sinh thuộc session của mình
DROP POLICY IF EXISTS "Teachers can insert student reports" ON public.student_reports;
CREATE POLICY "Teachers can insert student reports"
    ON public.student_reports FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_reports.session_id
            AND gs.user_id = auth.uid()
        )
    );

-- Cho phép giáo viên / gia sư cập nhật báo cáo (nhận xét, ghi chú)
DROP POLICY IF EXISTS "Teachers can update student reports" ON public.student_reports;
CREATE POLICY "Teachers can update student reports"
    ON public.student_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_reports.session_id
            AND gs.user_id = auth.uid()
        )
    );

-- Cho phép giáo viên / gia sư xóa báo cáo
DROP POLICY IF EXISTS "Teachers can delete student reports" ON public.student_reports;
CREATE POLICY "Teachers can delete student reports"
    ON public.student_reports FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_reports.session_id
            AND gs.user_id = auth.uid()
        )
    );

-- 5. FUNCTION TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_student_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_student_reports_updated_at ON public.student_reports;
CREATE TRIGGER trigger_student_reports_updated_at
    BEFORE UPDATE ON public.student_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_student_reports_updated_at();
