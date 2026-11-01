-- ========================================================
-- EduTest AI - Sprint 5: Student Portal & RBAC Migration
-- ========================================================

-- 1. Đảm bảo Check Constraint Role hỗ trợ đủ 4 vai trò
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('teacher', 'tutor', 'student', 'admin'));

-- 2. Bảng Lưu Trữ Báo Cáo Được Học Sinh Liên Kết (Claimed Reports)
CREATE TABLE IF NOT EXISTS public.student_claimed_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    report_token TEXT NOT NULL REFERENCES public.student_reports(token) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, report_token)
);

CREATE INDEX IF NOT EXISTS idx_student_claimed_student ON public.student_claimed_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_student_claimed_token ON public.student_claimed_reports(report_token);

-- 3. Bảng Giao Bài & Ghi Danh Bài Thi Của Học Sinh (Student Exam Enrollments)
CREATE TABLE IF NOT EXISTS public.student_exam_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    exam_id TEXT NOT NULL,
    session_id TEXT REFERENCES public.grading_sessions(id) ON DELETE SET NULL,
    exam_title TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT NOT NULL,
    teacher_name TEXT,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
    score NUMERIC(4, 2),
    submitted_answers JSONB DEFAULT '{}'::jsonb,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON public.student_exam_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_status ON public.student_exam_enrollments(status);

-- 4. Bảng Theo Dõi Phiếu Luyện Bù Của Học Sinh (Student Practice Enrollments)
CREATE TABLE IF NOT EXISTS public.student_practice_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sheet_token TEXT NOT NULL REFERENCES public.remediation_sheets(token) ON DELETE CASCADE,
    exam_title TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    score NUMERIC(4, 2),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    UNIQUE(student_id, sheet_token)
);

CREATE INDEX IF NOT EXISTS idx_student_practice_student ON public.student_practice_enrollments(student_id);

-- 5. Bật Row Level Security (RLS)
ALTER TABLE public.student_claimed_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_practice_enrollments ENABLE ROW LEVEL SECURITY;

-- Policies cho student_claimed_reports
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_claimed_reports' AND policyname = 'Students can manage their claimed reports'
    ) THEN
        CREATE POLICY "Students can manage their claimed reports"
            ON public.student_claimed_reports FOR ALL
            USING (auth.uid() = student_id)
            WITH CHECK (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_exam_enrollments' AND policyname = 'Students can manage their exam enrollments'
    ) THEN
        CREATE POLICY "Students can manage their exam enrollments"
            ON public.student_exam_enrollments FOR ALL
            USING (auth.uid() = student_id)
            WITH CHECK (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'student_practice_enrollments' AND policyname = 'Students can manage their practice enrollments'
    ) THEN
        CREATE POLICY "Students can manage their practice enrollments"
            ON public.student_practice_enrollments FOR ALL
            USING (auth.uid() = student_id)
            WITH CHECK (auth.uid() = student_id);
    END IF;
END $$;
