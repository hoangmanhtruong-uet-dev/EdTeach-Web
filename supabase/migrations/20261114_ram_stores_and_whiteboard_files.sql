-- ==============================================================================
-- Migration: 20261114_ram_stores_and_whiteboard_files.sql
-- PR 3.2: Di trú toàn bộ RAM Stores (globalThis / In-Memory Maps) sang PostgreSQL
-- Khắc phục triệt để: RC-07, SEC-08, STU-07, GRD-05, GRD-07, WBD-05
-- ==============================================================================

-- ==============================================================================
-- 1. BẢNG STUDENT_SUBMISSION_LINKS (LIÊN KẾT TỰ NỘP BÀI CỦA HỌC SINH)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_submission_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    session_name TEXT NOT NULL DEFAULT 'Kỳ thi trắc nghiệm',
    subject TEXT NOT NULL DEFAULT 'Toán',
    grade TEXT NOT NULL DEFAULT '10',
    class_name TEXT NOT NULL DEFAULT '',
    student_name TEXT,
    student_code TEXT,
    token VARCHAR(64) UNIQUE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    question_count INTEGER NOT NULL DEFAULT 20 CHECK (question_count > 0),
    sheet_type TEXT NOT NULL DEFAULT '20',
    answer_key JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    submissions_count INTEGER NOT NULL DEFAULT 0 CHECK (submissions_count >= 0),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes tối ưu truy vấn theo token, giáo viên và kỳ thi
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_submission_links_token 
    ON public.student_submission_links(token);

CREATE INDEX IF NOT EXISTS idx_student_submission_links_user_id 
    ON public.student_submission_links(user_id);

CREATE INDEX IF NOT EXISTS idx_student_submission_links_session_id 
    ON public.student_submission_links(session_id);

CREATE INDEX IF NOT EXISTS idx_student_submission_links_expires_at 
    ON public.student_submission_links(expires_at);

CREATE INDEX IF NOT EXISTS idx_student_submission_links_created_at 
    ON public.student_submission_links(created_at DESC);

-- Kích hoạt Row Level Security (RLS)
ALTER TABLE public.student_submission_links ENABLE ROW LEVEL SECURITY;

-- RLS: Giáo viên chỉ có quyền xem/sửa/xóa liên kết nộp bài do chính mình tạo
DROP POLICY IF EXISTS "Teachers can view their own submission links" ON public.student_submission_links;
CREATE POLICY "Teachers can view their own submission links"
    ON public.student_submission_links FOR SELECT
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_submission_links.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Teachers can create submission links" ON public.student_submission_links;
CREATE POLICY "Teachers can create submission links"
    ON public.student_submission_links FOR INSERT
    WITH CHECK (
        user_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "Teachers can update their own submission links" ON public.student_submission_links;
CREATE POLICY "Teachers can update their own submission links"
    ON public.student_submission_links FOR UPDATE
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_submission_links.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Teachers can delete their own submission links" ON public.student_submission_links;
CREATE POLICY "Teachers can delete their own submission links"
    ON public.student_submission_links FOR DELETE
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_submission_links.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    );

-- Trigger cập nhật updated_at tự động
CREATE OR REPLACE FUNCTION public.handle_student_submission_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_student_submission_links_updated_at ON public.student_submission_links;
CREATE TRIGGER trigger_student_submission_links_updated_at
    BEFORE UPDATE ON public.student_submission_links
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_student_submission_links_updated_at();


-- ==============================================================================
-- 2. BẢNG STUDENT_SUBMISSIONS (BÀI NỘP TRỰC TUYẾN CỦA HỌC SINH)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID REFERENCES public.student_submission_links(id) ON DELETE CASCADE,
    link_token VARCHAR(64) NOT NULL,
    session_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_code TEXT NOT NULL DEFAULT '',
    class_name TEXT NOT NULL DEFAULT '',
    exam_code TEXT NOT NULL DEFAULT '101',
    score NUMERIC(4, 2) NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 10),
    correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    incorrect_count INTEGER NOT NULL DEFAULT 0 CHECK (incorrect_count >= 0),
    empty_count INTEGER NOT NULL DEFAULT 0 CHECK (empty_count >= 0),
    total_questions INTEGER NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    details JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'graded' CHECK (status IN ('submitted', 'graded', 'pending', 'rejected')),
    source TEXT NOT NULL DEFAULT 'student_self',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes tối ưu tra cứu bài nộp theo link và kỳ thi
CREATE INDEX IF NOT EXISTS idx_student_submissions_link_id 
    ON public.student_submissions(link_id);

CREATE INDEX IF NOT EXISTS idx_student_submissions_link_token 
    ON public.student_submissions(link_token);

CREATE INDEX IF NOT EXISTS idx_student_submissions_session_id 
    ON public.student_submissions(session_id);

CREATE INDEX IF NOT EXISTS idx_student_submissions_created_at 
    ON public.student_submissions(created_at DESC);

-- Kích hoạt RLS
ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;

-- RLS: Giáo viên sở hữu liên kết hoặc phiên chấm thi có toàn quyền xem bài nộp
DROP POLICY IF EXISTS "Teachers can view student submissions" ON public.student_submissions;
CREATE POLICY "Teachers can view student submissions"
    ON public.student_submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.student_submission_links l
            WHERE l.id = student_submissions.link_id
            AND l.user_id = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_submissions.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Teachers can delete student submissions" ON public.student_submissions;
CREATE POLICY "Teachers can delete student submissions"
    ON public.student_submissions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.student_submission_links l
            WHERE l.id = student_submissions.link_id
            AND l.user_id = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.grading_sessions gs
            WHERE gs.id = student_submissions.session_id
            AND gs.user_id = (SELECT auth.uid())
        )
    );

-- Trigger cập nhật updated_at tự động
DROP TRIGGER IF EXISTS trigger_student_submissions_updated_at ON public.student_submissions;
CREATE TRIGGER trigger_student_submissions_updated_at
    BEFORE UPDATE ON public.student_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_student_submission_links_updated_at();


-- ==============================================================================
-- 3. BẢNG REMOTE_CAM_SESSIONS (PHIÊN QUÉT CAMERA DI ĐỘNG KHÔNG DÂY)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.remote_cam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    session_code VARCHAR(64) UNIQUE NOT NULL, -- token (ví dụ: cam_a1b2c3d4)
    pin VARCHAR(10) NOT NULL, -- PIN 4 số kết nối nhanh
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'connected', 'active', 'closed', 'expired')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    connected BOOLEAN NOT NULL DEFAULT false,
    connected_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    pending_submissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    latest_result JSONB DEFAULT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '4 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes tối ưu truy vấn kết nối camera
CREATE UNIQUE INDEX IF NOT EXISTS idx_remote_cam_sessions_code 
    ON public.remote_cam_sessions(session_code);

CREATE INDEX IF NOT EXISTS idx_remote_cam_sessions_pin 
    ON public.remote_cam_sessions(pin);

CREATE INDEX IF NOT EXISTS idx_remote_cam_sessions_teacher 
    ON public.remote_cam_sessions(teacher_id);

CREATE INDEX IF NOT EXISTS idx_remote_cam_sessions_session_id 
    ON public.remote_cam_sessions(session_id);

CREATE INDEX IF NOT EXISTS idx_remote_cam_sessions_status 
    ON public.remote_cam_sessions(status);

CREATE INDEX IF NOT EXISTS idx_remote_cam_sessions_expires_at 
    ON public.remote_cam_sessions(expires_at);

-- Kích hoạt RLS
ALTER TABLE public.remote_cam_sessions ENABLE ROW LEVEL SECURITY;

-- RLS: Giáo viên chỉ có quyền quản trị phiên quét do mình khởi tạo
DROP POLICY IF EXISTS "Teachers can view their own remote cam sessions" ON public.remote_cam_sessions;
CREATE POLICY "Teachers can view their own remote cam sessions"
    ON public.remote_cam_sessions FOR SELECT
    USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can create remote cam sessions" ON public.remote_cam_sessions;
CREATE POLICY "Teachers can create remote cam sessions"
    ON public.remote_cam_sessions FOR INSERT
    WITH CHECK (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can update their own remote cam sessions" ON public.remote_cam_sessions;
CREATE POLICY "Teachers can update their own remote cam sessions"
    ON public.remote_cam_sessions FOR UPDATE
    USING (teacher_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can delete their own remote cam sessions" ON public.remote_cam_sessions;
CREATE POLICY "Teachers can delete their own remote cam sessions"
    ON public.remote_cam_sessions FOR DELETE
    USING (teacher_id = (SELECT auth.uid()));

-- Trigger cập nhật updated_at tự động
DROP TRIGGER IF EXISTS trigger_remote_cam_sessions_updated_at ON public.remote_cam_sessions;
CREATE TRIGGER trigger_remote_cam_sessions_updated_at
    BEFORE UPDATE ON public.remote_cam_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_student_submission_links_updated_at();


-- ==============================================================================
-- 4. BẢNG REMOTE_CAM_PIN_ATTEMPTS (CHỐNG BRUTE FORCE PIN TRÊN SERVERLESS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.remote_cam_pin_attempts (
    ip TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 1,
    locked_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE OR REPLACE FUNCTION public.check_and_record_remote_pin_attempt(
    p_ip TEXT,
    p_is_success BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_rec public.remote_cam_pin_attempts%ROWTYPE;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF p_is_success THEN
        DELETE FROM public.remote_cam_pin_attempts WHERE ip = p_ip;
        RETURN jsonb_build_object('allowed', true);
    END IF;

    SELECT * INTO v_rec FROM public.remote_cam_pin_attempts WHERE ip = p_ip;

    IF FOUND THEN
        IF v_rec.locked_until IS NOT NULL AND v_now < v_rec.locked_until THEN
            RETURN jsonb_build_object(
                'allowed', false,
                'wait_seconds', CEIL(EXTRACT(EPOCH FROM (v_rec.locked_until - v_now)))
            );
        END IF;

        IF v_rec.locked_until IS NOT NULL AND v_now >= v_rec.locked_until THEN
            UPDATE public.remote_cam_pin_attempts
            SET attempts = 1, locked_until = NULL, updated_at = v_now
            WHERE ip = p_ip;
            RETURN jsonb_build_object('allowed', true);
        END IF;

        IF v_rec.attempts + 1 >= 5 THEN
            UPDATE public.remote_cam_pin_attempts
            SET attempts = v_rec.attempts + 1,
                locked_until = v_now + interval '10 minutes',
                updated_at = v_now
            WHERE ip = p_ip;
            RETURN jsonb_build_object('allowed', false, 'wait_seconds', 600);
        ELSE
            UPDATE public.remote_cam_pin_attempts
            SET attempts = v_rec.attempts + 1, updated_at = v_now
            WHERE ip = p_ip;
            RETURN jsonb_build_object('allowed', true);
        END IF;
    ELSE
        INSERT INTO public.remote_cam_pin_attempts (ip, attempts, locked_until, updated_at)
        VALUES (p_ip, 1, NULL, v_now);
        RETURN jsonb_build_object('allowed', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ==============================================================================
-- 5. HÀM ATOMIC THAO TÁC HÀNG ĐỢI ẢNH CAMERA KHÔNG DÂY (RACE-CONDITION FREE)
-- ==============================================================================

-- Đẩy ảnh chụp từ camera điện thoại vào phiên quét
CREATE OR REPLACE FUNCTION public.submit_remote_cam_photo(
    p_token TEXT,
    p_submission JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_session_id UUID;
BEGIN
    UPDATE public.remote_cam_sessions
    SET pending_submissions = pending_submissions || jsonb_build_array(p_submission),
        last_active_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE session_code = p_token
      AND status <> 'closed'
      AND expires_at > timezone('utc'::text, now())
    RETURNING id INTO v_session_id;

    IF v_session_id IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN p_submission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Tiêu thụ hàng đợi ảnh bài thi từ PC polling một cách nguyên tử
CREATE OR REPLACE FUNCTION public.consume_remote_cam_submissions(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
    v_subs JSONB;
BEGIN
    WITH old_val AS (
        SELECT pending_submissions
        FROM public.remote_cam_sessions
        WHERE session_code = p_token
          AND status <> 'closed'
          AND expires_at > timezone('utc'::text, now())
        FOR UPDATE
    ),
    do_update AS (
        UPDATE public.remote_cam_sessions s
        SET pending_submissions = '[]'::jsonb,
            last_active_at = timezone('utc'::text, now()),
            updated_at = timezone('utc'::text, now())
        FROM old_val
        WHERE s.session_code = p_token
        RETURNING old_val.pending_submissions
    )
    SELECT pending_submissions INTO v_subs FROM do_update;

    RETURN COALESCE(v_subs, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ==============================================================================
-- 6. HỖ TRỢ EXCALIDRAW WHITEBOARD FILES JSONB (WBD-05)
-- ==============================================================================

ALTER TABLE public.whiteboards 
ADD COLUMN IF NOT EXISTS files JSONB NOT NULL DEFAULT '[]'::jsonb;
