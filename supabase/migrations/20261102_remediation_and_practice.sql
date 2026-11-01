-- ==============================================================================
-- Migration: 20261102_remediation_and_practice.sql
-- Mục tiêu Sprint 2: AI Remediation — Phiếu Luyện Bù Lỗ Hổng Kiến Thức (Tutor OS)
-- ==============================================================================

-- 1. BẢNG REMEDIATION_SHEETS (PHIẾU LUYỆN BÙ CÁ NHÂN HÓA THEO CÂU SAI)
CREATE TABLE IF NOT EXISTS public.remediation_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(32) UNIQUE NOT NULL,
    session_id TEXT NOT NULL REFERENCES public.grading_sessions(id) ON DELETE CASCADE,
    report_token VARCHAR(32),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_code TEXT,
    class_name TEXT,
    subject TEXT NOT NULL DEFAULT 'Toán',
    grade TEXT NOT NULL DEFAULT '12',
    exam_title TEXT NOT NULL,
    
    -- Danh sách câu hỏi gốc bị làm sai từ bài kiểm tra
    target_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Danh sách câu hỏi đồng dạng (Isomorphic) do AI sinh ra kèm số đẹp và barem 3 bước
    cloned_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Thương hiệu gia sư (MAX Tier)
    custom_branding JSONB DEFAULT '{
        "tutorName": null,
        "phone": null,
        "centerName": null,
        "slogan": null
    }'::jsonb,
    
    -- Trạng thái học sinh làm bài: 'pending' (chưa làm), 'in_progress', 'completed' (đã nộp)
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    submission_data JSONB DEFAULT NULL,
    score NUMERIC(4, 2) DEFAULT NULL,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. INDEXES TĂNG TỐC TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_remediation_sheets_token ON public.remediation_sheets(token);
CREATE INDEX IF NOT EXISTS idx_remediation_sheets_session_student ON public.remediation_sheets(session_id, student_id);
CREATE INDEX IF NOT EXISTS idx_remediation_sheets_report_token ON public.remediation_sheets(report_token);
CREATE INDEX IF NOT EXISTS idx_remediation_sheets_status ON public.remediation_sheets(status);
CREATE INDEX IF NOT EXISTS idx_remediation_sheets_created_at ON public.remediation_sheets(created_at DESC);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.remediation_sheets ENABLE ROW LEVEL SECURITY;

-- Cho phép học sinh đọc đề bài luyện bù qua token công khai (không cần login)
DROP POLICY IF EXISTS "Public can view practice sheet with valid token" ON public.remediation_sheets;
CREATE POLICY "Public can view practice sheet with valid token"
    ON public.remediation_sheets FOR SELECT
    USING (true);

-- Cho phép học sinh cập nhật bài nộp qua token
DROP POLICY IF EXISTS "Public can submit practice sheet" ON public.remediation_sheets;
CREATE POLICY "Public can submit practice sheet"
    ON public.remediation_sheets FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Cho phép giáo viên sở hữu session tạo và quản lý phiếu luyện bù
DROP POLICY IF EXISTS "Teachers can insert and manage remediation sheets" ON public.remediation_sheets;
CREATE POLICY "Teachers can insert and manage remediation sheets"
    ON public.remediation_sheets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = remediation_sheets.session_id
            AND gs.user_id = auth.uid()
        )
    );

-- 4. FUNCTION TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_remediation_sheets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_remediation_sheets_updated_at ON public.remediation_sheets;
CREATE TRIGGER trigger_remediation_sheets_updated_at
    BEFORE UPDATE ON public.remediation_sheets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_remediation_sheets_updated_at();
