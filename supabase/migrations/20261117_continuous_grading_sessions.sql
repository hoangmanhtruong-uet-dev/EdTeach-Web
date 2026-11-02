-- ==============================================================================
-- EdTeach - Continuous Grading Sessions & Submissions Schema
-- Migration: 20261117_continuous_grading_sessions.sql
-- ==============================================================================

-- 1. BẢNG GRADING_SESSIONS (Mở rộng / Tạo mới chuẩn phiên chấm liên tục)
CREATE TABLE IF NOT EXISTS public.grading_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    session_token VARCHAR(64) UNIQUE,
    pin VARCHAR(10),
    name TEXT NOT NULL DEFAULT 'Phiên chấm liên tục',
    subject TEXT NOT NULL DEFAULT 'Toán',
    grade TEXT NOT NULL DEFAULT '10',
    sheet_type TEXT NOT NULL DEFAULT '20',
    question_count INTEGER NOT NULL DEFAULT 20,
    answer_key JSONB NOT NULL DEFAULT '{}'::jsonb,
    roster JSONB NOT NULL DEFAULT '[]'::jsonb,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    device_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'not_started', 'in_progress', 'completed')),
    graded_students JSONB NOT NULL DEFAULT '[]'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '12 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Bổ sung các cột nếu bảng grading_sessions đã tồn tại từ trước
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grading_sessions' AND column_name = 'session_token') THEN
        ALTER TABLE public.grading_sessions ADD COLUMN session_token VARCHAR(64) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grading_sessions' AND column_name = 'pin') THEN
        ALTER TABLE public.grading_sessions ADD COLUMN pin VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grading_sessions' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.grading_sessions ADD COLUMN teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grading_sessions' AND column_name = 'roster') THEN
        ALTER TABLE public.grading_sessions ADD COLUMN roster JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grading_sessions' AND column_name = 'config') THEN
        ALTER TABLE public.grading_sessions ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grading_sessions' AND column_name = 'device_count') THEN
        ALTER TABLE public.grading_sessions ADD COLUMN device_count INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grading_sessions' AND column_name = 'expires_at') THEN
        ALTER TABLE public.grading_sessions ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '12 hours');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grading_sessions' AND column_name = 'ended_at') THEN
        ALTER TABLE public.grading_sessions ADD COLUMN ended_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. BẢNG GRADING_SUBMISSIONS (Lưu từng bài nộp của học sinh trong phiên liên tục)
CREATE TABLE IF NOT EXISTS public.grading_submissions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES public.grading_sessions(id) ON DELETE CASCADE,
    client_submission_id TEXT UNIQUE,
    image_url TEXT,
    detected_sbd TEXT,
    detected_name TEXT,
    matched_student_id TEXT,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    correct_count INTEGER NOT NULL DEFAULT 0,
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
    status TEXT NOT NULL DEFAULT 'graded' CHECK (status IN ('processing', 'graded', 'needs_review', 'confirmed')),
    review_notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_grading_sessions_token ON public.grading_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_grading_sessions_pin ON public.grading_sessions(pin);
CREATE INDEX IF NOT EXISTS idx_grading_sessions_teacher_status ON public.grading_sessions(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_grading_submissions_session_id ON public.grading_submissions(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grading_submissions_status ON public.grading_submissions(status);
CREATE INDEX IF NOT EXISTS idx_grading_submissions_client_id ON public.grading_submissions(client_submission_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.grading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_submissions ENABLE ROW LEVEL SECURITY;

-- Policy cho grading_sessions
DROP POLICY IF EXISTS "Public can view session by token or pin" ON public.grading_sessions;
CREATE POLICY "Public can view session by token or pin"
    ON public.grading_sessions FOR SELECT
    USING (status = 'active' AND expires_at > timezone('utc'::text, now()));

DROP POLICY IF EXISTS "Teachers can manage own sessions" ON public.grading_sessions;
CREATE POLICY "Teachers can manage own sessions"
    ON public.grading_sessions FOR ALL
    USING (auth.uid() = teacher_id OR auth.uid() = user_id)
    WITH CHECK (auth.uid() = teacher_id OR auth.uid() = user_id);

-- Policy cho grading_submissions
DROP POLICY IF EXISTS "Anyone can insert submission with active session" ON public.grading_submissions;
CREATE POLICY "Anyone can insert submission with active session"
    ON public.grading_submissions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.grading_sessions
            WHERE id = session_id AND status = 'active' AND expires_at > timezone('utc'::text, now())
        )
    );

DROP POLICY IF EXISTS "Session owners can view and update submissions" ON public.grading_submissions;
CREATE POLICY "Session owners can view and update submissions"
    ON public.grading_submissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.grading_sessions
            WHERE id = session_id AND (auth.uid() = teacher_id OR auth.uid() = user_id)
        )
    );

-- 5. TRIGGER CẬP NHẬT UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_grading_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_grading_submissions_updated_at ON public.grading_submissions;
CREATE TRIGGER trigger_grading_submissions_updated_at
    BEFORE UPDATE ON public.grading_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_grading_submissions_updated_at();
