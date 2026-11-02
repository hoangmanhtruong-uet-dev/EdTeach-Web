-- ==============================================================================
-- Migration: 20261113_student_portal_core.sql
-- Milestone 4 (PR 3.1): Student Portal Core B2B2C & Server-side Grading RPC
--
-- Security & Functional Backlog Items Addressed:
-- 1. RC-04 / STU-06: Answer key & detailed solution leakage prevention.
--    - Answers/solutions masked until assignments.show_solutions_at <= now().
-- 2. RC-04 / STU-05 / STU-09: Score tampering elimination via server-side grading.
--    - Server-side atomic RPC grade_exam_attempt(p_attempt_id, p_idempotency_key, p_answers).
--    - Trigger prevent_exam_attempt_tampering() freezing score/status from client updates.
-- 3. RC-08 / STU-08: Student AI Tutor quota management & teacher wallet deduction.
--    - Max 3 AI tutor queries/day/student (GMT+7 Asia/Ho_Chi_Minh).
--    - Atomic 3-step reserve/commit/refund model deducting from teacher's wallet.
-- 4. STU-10 / STU-01: B2B2C Classroom architecture & verified exam join.
--    - Validates join_code against active classrooms before enrollment.
-- 5. STU-11: Deduplication of legacy student_exam_enrollments before unique constraint.
-- ==============================================================================

-- ==============================================================================
-- 1. CLEANUP & DEDUPLICATION OF LEGACY ENROLLMENTS (STU-11)
-- ==============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'student_exam_enrollments'
    ) THEN
        -- Giữ lại bản ghi mới nhất hoặc đã hoàn thành, xóa các bản ghi trùng lặp
        WITH ranked_enrollments AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY student_id, exam_id 
                       ORDER BY completed_at DESC NULLS LAST, assigned_at DESC NULLS LAST, id DESC
                   ) AS rn
            FROM public.student_exam_enrollments
        )
        DELETE FROM public.student_exam_enrollments
        WHERE id IN (
            SELECT id FROM ranked_enrollments WHERE rn > 1
        );

        -- Gán UNIQUE constraint an toàn
        ALTER TABLE public.student_exam_enrollments 
            DROP CONSTRAINT IF EXISTS uq_student_exam_enrollment;
        ALTER TABLE public.student_exam_enrollments 
            ADD CONSTRAINT uq_student_exam_enrollment UNIQUE (student_id, exam_id);
    END IF;
END $$;


-- ==============================================================================
-- 2. BẢNG CLASSROOMS (LỚP HỌC B2B2C - GIÁO VIÊN QUẢN LÝ)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    grade VARCHAR(10) NOT NULL CHECK (grade IN ('10', '11', '12')),
    subject VARCHAR(64) NOT NULL DEFAULT 'Toán Học',
    academic_year VARCHAR(16) NOT NULL DEFAULT '2025-2026',
    
    -- Mã tham gia lớp (8-16 ký tự alphanumeric an toàn, có thời hạn và có thể thu hồi)
    join_code VARCHAR(16) UNIQUE NOT NULL,
    join_code_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    is_join_code_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Hạn mức AI của lớp (tối đa lượt gọi mỗi ngày của cả lớp)
    ai_daily_quota INT NOT NULL DEFAULT 100 CHECK (ai_daily_quota >= 0),
    
    -- Bằng chứng ghi nhận đồng thuận phụ huynh/nhà trường theo Nghị định 13/2023/NĐ-CP
    consent_recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    consent_version VARCHAR(32) NOT NULL DEFAULT 'v1.0_2025_ND13',
    consent_statement TEXT NOT NULL DEFAULT 'Đã thu thập văn bản đồng thuận thông tin tối thiểu theo Nghị định 13/2023/NĐ-CP.',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON public.classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_join_code ON public.classrooms(join_code) WHERE is_join_code_active = true;


-- ==============================================================================
-- 3. BẢNG CLASSROOM_MEMBERS (THÀNH VIÊN LỚP HỌC)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.classroom_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    display_name VARCHAR(64) NOT NULL,
    student_code VARCHAR(32),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(classroom_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_members_student ON public.classroom_members(student_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_class ON public.classroom_members(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_lookup ON public.classroom_members(classroom_id, student_id, status);


-- ==============================================================================
-- 4. BẢNG ASSIGNMENTS (BÀI TẬP & KỲ THI GIAO CHO LỚP)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 45 CHECK (duration_minutes BETWEEN 5 AND 300),
    start_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    due_at TIMESTAMPTZ NOT NULL,
    
    -- STU-06: Thời điểm chính thức công bố đáp án & lời giải chi tiết cho học sinh
    -- NULL = Giáo viên chưa công bố; TIMESTAMPTZ = Chỉ xem được sau thời điểm này
    show_solutions_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Độ trễ mạng cho phép khi nộp bài (grace period tính bằng giây)
    grace_period_seconds INT NOT NULL DEFAULT 60 CHECK (grace_period_seconds BETWEEN 0 AND 300),
    
    settings JSONB NOT NULL DEFAULT '{
        "allow_review_before_submit": true,
        "show_score_immediately": true,
        "shuffle_questions": true,
        "shuffle_options": true,
        "max_attempts": 1
    }'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON public.assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_exam ON public.assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_at ON public.assignments(due_at);
CREATE INDEX IF NOT EXISTS idx_assignments_show_solutions ON public.assignments(show_solutions_at);


-- ==============================================================================
-- 5. BẢNG EXAM_ATTEMPTS (LƯỢT LÀM BÀI PHÒNG THI TRỰC TUYẾN)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' 
        CHECK (status IN ('in_progress', 'submitted', 'graded', 'timed_out')),
    
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    
    -- Bản lưu nháp câu trả lời học sinh (Autosave JSONB)
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    question_timings JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Kết quả chấm điểm do Server tính toán (Thang 10 chuẩn GDPT)
    score NUMERIC(4, 2) DEFAULT NULL CHECK (score IS NULL OR (score >= 0 AND score <= 10.00)),
    correct_count INT DEFAULT NULL CHECK (correct_count IS NULL OR correct_count >= 0),
    total_questions INT NOT NULL DEFAULT 40 CHECK (total_questions > 0),
    
    -- Khóa chống nộp trùng lặp (Idempotency)
    idempotency_key UUID UNIQUE,
    client_version INT NOT NULL DEFAULT 1,
    
    -- Nhật ký vi phạm / telemetry
    telemetry_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON public.exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_assignment ON public.exam_attempts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON public.exam_attempts(status);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_idempotency ON public.exam_attempts(idempotency_key);


-- ==============================================================================
-- 6. HẠN NGẠCH AI & TẠM GIỮ CREDITS (RC-08, STU-08)
-- ==============================================================================

-- Bảng ghi nhận lượt gọi AI thực tế của học sinh (3 lượt/ngày)
CREATE TABLE IF NOT EXISTS public.student_ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type VARCHAR(32) NOT NULL DEFAULT 'remediation_ai_tutor',
    usage_date DATE NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Ho_Chi_Minh'),
    credits_deducted INT NOT NULL DEFAULT 50 CHECK (credits_deducted >= 0),
    reservation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_student_ai_usage_limit 
    ON public.student_ai_usage(student_id, classroom_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_student_ai_usage_teacher 
    ON public.student_ai_usage(teacher_id, usage_date);

-- Bảng tạm giữ Credits nguyên tử (Atomic Credit Reservations: 60s hold time)
CREATE TABLE IF NOT EXISTS public.credit_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Giáo viên bị trừ credits
    student_id UUID REFERENCES public.users(id) ON DELETE SET NULL,     -- Học sinh kích hoạt
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'committed', 'refunded', 'expired')),
    action TEXT NOT NULL DEFAULT 'student_ai_remediation',
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '60 seconds'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_credit_reservations_user ON public.credit_reservations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_credit_reservations_status_expires ON public.credit_reservations(status, expires_at);


-- ==============================================================================
-- 7. KÍCH HOẠT ROW LEVEL SECURITY (RLS) & THIẾT LẬP CHÍNH SÁCH
-- ==============================================================================

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_reservations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 7.1 Chính sách bảng CLASSROOMS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can view their own classrooms" ON public.classrooms;
CREATE POLICY "Teachers can view their own classrooms"
    ON public.classrooms FOR SELECT
    USING ((SELECT auth.uid()) = teacher_id);

DROP POLICY IF EXISTS "Students can view classrooms they belong to" ON public.classrooms;
CREATE POLICY "Students can view classrooms they belong to"
    ON public.classrooms FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.classroom_members cm
            WHERE cm.classroom_id = classrooms.id
              AND cm.student_id = (SELECT auth.uid())
              AND cm.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Teachers can insert their own classrooms" ON public.classrooms;
CREATE POLICY "Teachers can insert their own classrooms"
    ON public.classrooms FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = teacher_id);

DROP POLICY IF EXISTS "Teachers can update their own classrooms" ON public.classrooms;
CREATE POLICY "Teachers can update their own classrooms"
    ON public.classrooms FOR UPDATE
    USING ((SELECT auth.uid()) = teacher_id);

DROP POLICY IF EXISTS "Teachers can delete their own classrooms" ON public.classrooms;
CREATE POLICY "Teachers can delete their own classrooms"
    ON public.classrooms FOR DELETE
    USING ((SELECT auth.uid()) = teacher_id);

-- ------------------------------------------------------------------------------
-- 7.2 Chính sách bảng CLASSROOM_MEMBERS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view their own membership" ON public.classroom_members;
CREATE POLICY "Members can view their own membership"
    ON public.classroom_members FOR SELECT
    USING (
        (SELECT auth.uid()) = student_id
        OR EXISTS (
            SELECT 1 FROM public.classrooms c
            WHERE c.id = classroom_members.classroom_id
              AND c.teacher_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Students can join or teachers can add members" ON public.classroom_members;
CREATE POLICY "Students can join or teachers can add members"
    ON public.classroom_members FOR INSERT
    WITH CHECK (
        (SELECT auth.uid()) = student_id
        OR EXISTS (
            SELECT 1 FROM public.classrooms c
            WHERE c.id = classroom_members.classroom_id
              AND c.teacher_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Teachers can manage classroom members" ON public.classroom_members;
CREATE POLICY "Teachers can manage classroom members"
    ON public.classroom_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.classrooms c
            WHERE c.id = classroom_members.classroom_id
              AND c.teacher_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Members can leave or teachers can remove" ON public.classroom_members;
CREATE POLICY "Members can leave or teachers can remove"
    ON public.classroom_members FOR DELETE
    USING (
        (SELECT auth.uid()) = student_id
        OR EXISTS (
            SELECT 1 FROM public.classrooms c
            WHERE c.id = classroom_members.classroom_id
              AND c.teacher_id = (SELECT auth.uid())
        )
    );

-- ------------------------------------------------------------------------------
-- 7.3 Chính sách bảng ASSIGNMENTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can view own assignments" ON public.assignments;
CREATE POLICY "Teachers can view own assignments"
    ON public.assignments FOR SELECT
    USING ((SELECT auth.uid()) = teacher_id);

DROP POLICY IF EXISTS "Students can view assigned classroom exams" ON public.assignments;
CREATE POLICY "Students can view assigned classroom exams"
    ON public.assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.classroom_members cm
            WHERE cm.classroom_id = assignments.classroom_id
              AND cm.student_id = (SELECT auth.uid())
              AND cm.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Teachers can manage assignments" ON public.assignments;
CREATE POLICY "Teachers can manage assignments"
    ON public.assignments FOR ALL
    USING ((SELECT auth.uid()) = teacher_id)
    WITH CHECK ((SELECT auth.uid()) = teacher_id);

-- ------------------------------------------------------------------------------
-- 7.4 Chính sách bảng EXAM_ATTEMPTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Students can view own attempts" ON public.exam_attempts;
CREATE POLICY "Students can view own attempts"
    ON public.exam_attempts FOR SELECT
    USING ((SELECT auth.uid()) = student_id);

DROP POLICY IF EXISTS "Teachers can view classroom attempts" ON public.exam_attempts;
CREATE POLICY "Teachers can view classroom attempts"
    ON public.exam_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = exam_attempts.assignment_id
              AND a.teacher_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Students can create initial attempt" ON public.exam_attempts;
CREATE POLICY "Students can create initial attempt"
    ON public.exam_attempts FOR INSERT
    WITH CHECK (
        (SELECT auth.uid()) = student_id
        AND status = 'in_progress'
        AND score IS NULL
        AND correct_count IS NULL
        AND submitted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.classroom_members cm ON cm.classroom_id = a.classroom_id
            WHERE a.id = exam_attempts.assignment_id
              AND cm.student_id = (SELECT auth.uid())
              AND cm.status = 'active'
              AND now() >= a.start_at
              AND now() <= a.due_at
        )
    );

-- Học sinh chỉ có quyền lưu nháp bài làm (answers) khi bài thi đang diễn ra
DROP POLICY IF EXISTS "Students can autosave in_progress attempt" ON public.exam_attempts;
CREATE POLICY "Students can autosave in_progress attempt"
    ON public.exam_attempts FOR UPDATE
    USING (
        (SELECT auth.uid()) = student_id
        AND status = 'in_progress'
        AND now() <= expires_at
    );

-- Thu hồi quyền DELETE từ học sinh
REVOKE DELETE ON public.exam_attempts FROM authenticated;
REVOKE ALL ON public.exam_attempts FROM anon;

-- ------------------------------------------------------------------------------
-- 7.5 Chính sách bảng AI USAGE & CREDIT RESERVATIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own AI usage" ON public.student_ai_usage;
CREATE POLICY "Users can view own AI usage"
    ON public.student_ai_usage FOR SELECT
    USING (
        (SELECT auth.uid()) = student_id 
        OR (SELECT auth.uid()) = teacher_id
    );

DROP POLICY IF EXISTS "Teachers can view own credit reservations" ON public.credit_reservations;
CREATE POLICY "Teachers can view own credit reservations"
    ON public.credit_reservations FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.student_ai_usage FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.credit_reservations FROM anon, authenticated;


-- ==============================================================================
-- 8. TRIGGER KHÓA ĐIỂM SỐ & CHỐNG THAO TÚNG ĐỒNG HỒ PHÒNG THI (RC-04, STU-05)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.prevent_exam_attempt_tampering()
RETURNS TRIGGER AS $$
BEGIN
    -- Nếu không phải service_role hoặc thủ tục nội bộ chấm điểm
    IF current_user <> 'service_role' AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        -- Học sinh không được phép sửa score, correct_count, total_questions, status sang 'graded'
        -- hoặc kéo dài expires_at
        IF (SELECT auth.uid()) = OLD.student_id THEN
            IF NEW.score IS DISTINCT FROM OLD.score THEN
                NEW.score := OLD.score;
            END IF;
            IF NEW.correct_count IS DISTINCT FROM OLD.correct_count THEN
                NEW.correct_count := OLD.correct_count;
            END IF;
            IF NEW.total_questions IS DISTINCT FROM OLD.total_questions THEN
                NEW.total_questions := OLD.total_questions;
            END IF;
            IF NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
                NEW.expires_at := OLD.expires_at;
            END IF;
            IF NEW.started_at IS DISTINCT FROM OLD.started_at THEN
                NEW.started_at := OLD.started_at;
            END IF;
            IF NEW.assignment_id IS DISTINCT FROM OLD.assignment_id THEN
                NEW.assignment_id := OLD.assignment_id;
            END IF;
            IF NEW.student_id IS DISTINCT FROM OLD.student_id THEN
                NEW.student_id := OLD.student_id;
            END IF;
            -- Không cho phép học sinh tự nhảy status sang 'graded'
            IF NEW.status = 'graded' AND OLD.status <> 'graded' THEN
                NEW.status := OLD.status;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_exam_attempt_tampering ON public.exam_attempts;
CREATE TRIGGER trg_prevent_exam_attempt_tampering
    BEFORE UPDATE ON public.exam_attempts
    FOR EACH ROW EXECUTE FUNCTION public.prevent_exam_attempt_tampering();


-- ==============================================================================
-- 9. RPC SERVER-SIDE GRADING CHẤM ĐIỂM NGUYÊN TỬ (GRADE_EXAM_ATTEMPT)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.grade_exam_attempt(
    p_attempt_id UUID,
    p_idempotency_key UUID,
    p_answers JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_attempt RECORD;
    v_assignment RECORD;
    v_exam RECORD;
    v_questions JSONB;
    v_total_questions INT;
    v_correct_count INT := 0;
    v_score NUMERIC(4, 2);
    v_show_solutions BOOLEAN := false;
    v_result_details JSONB := '[]'::jsonb;
    v_q RECORD;
    v_q_key TEXT;
    v_student_ans TEXT;
    v_correct_ans TEXT;
    v_is_correct BOOLEAN;
    v_explanation TEXT;
    v_cognitive_level TEXT;
BEGIN
    -- 9.1 Khóa hàng lượt làm bài với FOR UPDATE để triệt tiêu Race Condition
    SELECT * INTO v_attempt
    FROM public.exam_attempts
    WHERE id = p_attempt_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ATTEMPT_NOT_FOUND',
            'message', 'Không tìm thấy lượt làm bài thi.'
        );
    END IF;

    -- 9.2 Kiểm tra quyền sở hữu bài làm
    IF v_attempt.student_id IS DISTINCT FROM auth.uid() 
       AND current_user <> 'service_role' 
       AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNAUTHORIZED',
            'message', 'Bạn không có quyền nộp bài thi này.'
        );
    END IF;

    -- 9.3 Kiểm tra Idempotency: Nếu bài thi đã nộp/chấm với cùng idempotency_key
    IF v_attempt.status IN ('submitted', 'graded') THEN
        IF v_attempt.idempotency_key = p_idempotency_key THEN
            -- Lấy cờ hiển thị đáp án hiện tại
            SELECT * INTO v_assignment 
            FROM public.assignments WHERE id = v_attempt.assignment_id;
            
            v_show_solutions := (v_assignment.show_solutions_at IS NOT NULL AND now() >= v_assignment.show_solutions_at);
            
            RETURN jsonb_build_object(
                'success', true,
                'idempotent_replay', true,
                'score', v_attempt.score,
                'correct_count', v_attempt.correct_count,
                'total_questions', v_attempt.total_questions,
                'status', v_attempt.status,
                'can_view_answers', v_show_solutions,
                'message', 'Bài thi đã được ghi nhận kết quả trước đó.'
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'error', 'ALREADY_SUBMITTED',
                'message', 'Bài thi đã được nộp và chấm điểm trước đó.'
            );
        END IF;
    END IF;

    -- 9.4 Lấy cấu hình bài tập & kiểm tra thời hạn
    SELECT * INTO v_assignment 
    FROM public.assignments 
    WHERE id = v_attempt.assignment_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ASSIGNMENT_NOT_FOUND', 'message', 'Bài tập không tồn tại.');
    END IF;

    -- Kiểm tra thời hạn với độ trễ cho phép (Grace Period)
    IF now() > (v_attempt.expires_at + (COALESCE(v_assignment.grace_period_seconds, 60) * interval '1 second')) THEN
        UPDATE public.exam_attempts
        SET status = 'timed_out',
            submitted_at = timezone('utc'::text, now()),
            updated_at = timezone('utc'::text, now())
        WHERE id = p_attempt_id;

        RETURN jsonb_build_object(
            'success', false,
            'error', 'EXAM_TIMED_OUT',
            'message', 'Đã quá thời hạn nộp bài quy định.'
        );
    END IF;

    -- 9.5 Kiểm tra cờ công bố đáp án chi tiết
    IF v_assignment.show_solutions_at IS NOT NULL AND now() >= v_assignment.show_solutions_at THEN
        v_show_solutions := true;
    END IF;

    -- 9.6 Trích xuất đáp án chuẩn nội bộ từ Server (Bảng questions hoặc exams.config)
    SELECT jsonb_agg(jsonb_build_object(
        'order_index', COALESCE(q.order_index, 0),
        'id', q.id,
        'correct_answer', q.correct_answer,
        'difficulty', COALESCE(q.difficulty, 'medium'),
        'explanation', q.explanation
    ) ORDER BY q.order_index ASC) INTO v_questions
    FROM public.questions q
    WHERE q.exam_id = v_attempt.exam_id;

    -- Fallback nếu đề thi lưu câu hỏi trong config JSONB
    IF v_questions IS NULL OR jsonb_array_length(v_questions) = 0 THEN
        SELECT CASE WHEN jsonb_typeof(config->'questions') = 'array' THEN config->'questions' ELSE '[]'::jsonb END INTO v_questions
        FROM public.exams
        WHERE id = v_attempt.exam_id;
    END IF;

    v_total_questions := COALESCE(jsonb_array_length(v_questions), v_attempt.total_questions, 40);

    -- 9.7 Đối chiếu từng câu hỏi và chấm điểm
    IF v_questions IS NOT NULL AND jsonb_array_length(v_questions) > 0 THEN
        FOR v_q IN SELECT * FROM jsonb_array_elements(v_questions) LOOP
            v_q_key := COALESCE(v_q.value->>'order_index', v_q.value->>'id');
            v_correct_ans := UPPER(TRIM(COALESCE(v_q.value->>'correct_answer', v_q.value->>'correct', '')));
            
            -- Trích xuất đáp án học sinh: hỗ trợ cả {"1": "A"} và {"1": {"selected": "A"}}
            v_student_ans := UPPER(TRIM(COALESCE(
                p_answers->v_q_key->>'selected',
                p_answers->>v_q_key,
                ''
            )));

            v_explanation := v_q.value->>'explanation';
            v_cognitive_level := COALESCE(v_q.value->>'difficulty', 'medium');

            IF v_student_ans <> '' AND v_student_ans = v_correct_ans THEN
                v_correct_count := v_correct_count + 1;
                v_is_correct := true;
            ELSE
                v_is_correct := false;
            END IF;

            -- STU-06: Ẩn tuyệt đối đáp án đúng & giải thích nếu chưa đến hạn công bố
            v_result_details := v_result_details || jsonb_build_object(
                'question_key', v_q_key,
                'student_answer', v_student_ans,
                'is_correct', v_is_correct,
                'cognitive_level', v_cognitive_level,
                'correct_answer', CASE WHEN v_show_solutions THEN v_correct_ans ELSE NULL END,
                'explanation', CASE WHEN v_show_solutions THEN v_explanation ELSE NULL END
            );
        END LOOP;
    END IF;

    -- Tính điểm thang 10 chuẩn GDPT làm tròn 2 chữ số thập phân
    v_score := ROUND(((v_correct_count::numeric / GREATEST(v_total_questions, 1)) * 10.0), 2);

    -- 9.8 Cập nhật trạng thái lượt thi sang 'graded'
    UPDATE public.exam_attempts
    SET 
        status = 'graded',
        submitted_at = timezone('utc'::text, now()),
        score = v_score,
        correct_count = v_correct_count,
        total_questions = v_total_questions,
        answers = p_answers,
        idempotency_key = p_idempotency_key,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_attempt_id;

    -- Đồng bộ bảng legacy student_exam_enrollments (nếu có)
    UPDATE public.student_exam_enrollments
    SET status = 'completed',
        score = v_score,
        completed_at = timezone('utc'::text, now()),
        submitted_answers = p_answers
    WHERE student_id = v_attempt.student_id AND exam_id = v_attempt.exam_id::text;

    RETURN jsonb_build_object(
        'success', true,
        'score', v_score,
        'correct_count', v_correct_count,
        'total_questions', v_total_questions,
        'can_view_answers', v_show_solutions,
        'details', v_result_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.grade_exam_attempt(UUID, UUID, JSONB) TO authenticated, service_role;


-- ==============================================================================
-- 10. RPC AN TOÀN TRÍCH XUẤT ĐỀ THI ẨN ĐÁP ÁN (GET_STUDENT_EXAM_QUESTIONS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_student_exam_questions(p_attempt_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_attempt RECORD;
    v_assignment RECORD;
    v_questions JSONB;
    v_clean_questions JSONB := '[]'::jsonb;
    v_q RECORD;
    v_can_view_solutions BOOLEAN := false;
BEGIN
    SELECT * INTO v_attempt 
    FROM public.exam_attempts 
    WHERE id = p_attempt_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ATTEMPT_NOT_FOUND');
    END IF;

    -- Kiểm tra quyền học sinh sở hữu hoặc giáo viên sở hữu
    IF v_attempt.student_id IS DISTINCT FROM auth.uid() 
       AND current_user <> 'service_role' 
       AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.assignments a 
            WHERE a.id = v_attempt.assignment_id AND a.teacher_id = auth.uid()
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
        END IF;
    END IF;

    SELECT * INTO v_assignment 
    FROM public.assignments 
    WHERE id = v_attempt.assignment_id;

    -- Chỉ cho phép xem giải đáp khi đã nộp xong VÀ giáo viên đã công bố
    IF v_attempt.status IN ('submitted', 'graded') AND 
       v_assignment.show_solutions_at IS NOT NULL AND 
       now() >= v_assignment.show_solutions_at THEN
        v_can_view_solutions := true;
    END IF;

    -- Trích xuất câu hỏi từ bảng questions
    SELECT jsonb_agg(jsonb_build_object(
        'id', q.id,
        'order_index', q.order_index,
        'type', q.type,
        'content', q.content,
        'options', q.options,
        'difficulty', COALESCE(q.difficulty, 'medium'),
        -- STU-06: Ẩn hoàn toàn trường đáp án và lời giải
        'correct_answer', CASE WHEN v_can_view_solutions THEN q.correct_answer ELSE NULL END,
        'explanation', CASE WHEN v_can_view_solutions THEN q.explanation ELSE NULL END
    ) ORDER BY q.order_index ASC) INTO v_questions
    FROM public.questions q
    WHERE q.exam_id = v_attempt.exam_id;

    -- Fallback config JSONB
    IF v_questions IS NULL OR jsonb_array_length(v_questions) = 0 THEN
        SELECT jsonb_agg(jsonb_build_object(
            'id', elem->>'id',
            'order_index', COALESCE((elem->>'order_index')::int, 0),
            'type', COALESCE(elem->>'type', 'multiple_choice'),
            'content', elem->>'content',
            'options', elem->'options',
            'difficulty', COALESCE(elem->>'difficulty', 'medium'),
            'correct_answer', CASE WHEN v_can_view_solutions THEN elem->>'correct_answer' ELSE NULL END,
            'explanation', CASE WHEN v_can_view_solutions THEN elem->>'explanation' ELSE NULL END
        )) INTO v_questions
        FROM public.exams e,
             jsonb_array_elements(CASE WHEN jsonb_typeof(e.config->'questions') = 'array' THEN e.config->'questions' ELSE '[]'::jsonb END) AS elem
        WHERE e.id = v_attempt.exam_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'attempt_id', v_attempt.id,
        'status', v_attempt.status,
        'started_at', v_attempt.started_at,
        'expires_at', v_attempt.expires_at,
        'duration_minutes', v_assignment.duration_minutes,
        'title', v_assignment.title,
        'can_view_solutions', v_can_view_solutions,
        'questions', COALESCE(v_questions, '[]'::jsonb),
        'saved_answers', v_attempt.answers
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_student_exam_questions(UUID) TO authenticated, service_role;


-- ==============================================================================
-- 11. HỆ THỐNG QUẢN LÝ QUOTA AI GIÁO VIÊN CHO HỌC SINH (RC-08, STU-08)
-- ==============================================================================

-- 11.1 Giữ chỗ Credits giáo viên (Reserve)
CREATE OR REPLACE FUNCTION public.reserve_teacher_ai_credits(
    p_student_id UUID,
    p_classroom_id UUID,
    p_amount INTEGER DEFAULT 50
)
RETURNS JSONB AS $$
DECLARE
    v_classroom RECORD;
    v_teacher_wallet RECORD;
    v_today_usage INT;
    v_total_available INT;
    v_reservation_id UUID := gen_random_uuid();
    v_deduct_promo INT;
    v_deduct_purchased INT;
    v_new_promo INT;
    v_new_purchased INT;
BEGIN
    -- Xác thực học sinh đang gọi hàm
    IF p_student_id IS DISTINCT FROM auth.uid() 
       AND current_user <> 'service_role' 
       AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED', 'message', 'Không có quyền thực hiện.');
    END IF;

    -- Kiểm tra học sinh là thành viên đang hoạt động của lớp
    SELECT c.* INTO v_classroom
    FROM public.classrooms c
    JOIN public.classroom_members cm ON cm.classroom_id = c.id
    WHERE c.id = p_classroom_id
      AND cm.student_id = p_student_id
      AND cm.status = 'active';

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NOT_CLASSROOM_MEMBER',
            'message', 'Bạn không thuộc lớp học này hoặc lớp chưa kích hoạt.'
        );
    END IF;

    -- Kiểm tra hạn ngạch 3 lượt/ngày/học sinh (Múi giờ Asia/Ho_Chi_Minh GMT+7)
    SELECT COUNT(*) INTO v_today_usage
    FROM public.student_ai_usage
    WHERE student_id = p_student_id
      AND classroom_id = p_classroom_id
      AND usage_date = (CURRENT_DATE AT TIME ZONE 'Asia/Ho_Chi_Minh');

    IF v_today_usage >= 3 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'DAILY_QUOTA_EXCEEDED',
            'limit', 3,
            'used', v_today_usage,
            'message', 'Bạn đã sử dụng hết 3 lượt trợ lý AI hôm nay. Hãy ôn tập lại các bài đã giải nhé!'
        );
    END IF;

    -- Khóa ví giáo viên với FOR UPDATE để kiểm tra và trừ tiền tạm giữ
    SELECT * INTO v_teacher_wallet
    FROM public.wallets
    WHERE user_id = v_classroom.teacher_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'TEACHER_WALLET_NOT_FOUND',
            'message', 'Thầy/Cô chưa kích hoạt ví credits cho lớp.'
        );
    END IF;

    v_total_available := COALESCE(v_teacher_wallet.promotional_balance, 0) + COALESCE(v_teacher_wallet.purchased_balance, 0);

    IF v_total_available < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'TEACHER_INSUFFICIENT_CREDITS',
            'message', 'Hạn mức trợ lý AI của lớp hiện đã tạm hết. Thầy/Cô sẽ nạp thêm sớm!'
        );
    END IF;

    -- Khấu trừ tạm thời vào ví: ưu tiên promotional_balance trước
    v_deduct_promo := LEAST(COALESCE(v_teacher_wallet.promotional_balance, 0), p_amount);
    v_deduct_purchased := p_amount - v_deduct_promo;

    v_new_promo := COALESCE(v_teacher_wallet.promotional_balance, 0) - v_deduct_promo;
    v_new_purchased := COALESCE(v_teacher_wallet.purchased_balance, 0) - v_deduct_purchased;

    UPDATE public.wallets
    SET promotional_balance = v_new_promo,
        purchased_balance = v_new_purchased,
        balance = v_new_promo + v_new_purchased,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_teacher_wallet.id;

    -- Lưu bản ghi tạm giữ với thời hạn 60 giây
    INSERT INTO public.credit_reservations (
        id,
        user_id,
        student_id,
        classroom_id,
        amount,
        status,
        action,
        metadata,
        expires_at
    ) VALUES (
        v_reservation_id,
        v_classroom.teacher_id,
        p_student_id,
        p_classroom_id,
        p_amount,
        'pending',
        'student_ai_remediation',
        jsonb_build_object(
            'promo_deducted', v_deduct_promo,
            'purchased_deducted', v_deduct_purchased
        ),
        now() + interval '60 seconds'
    );

    RETURN jsonb_build_object(
        'success', true,
        'reservation_id', v_reservation_id,
        'remaining_daily', 3 - (v_today_usage + 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 11.2 Xác nhận tiêu thụ Credits khi AI thành công (Commit)
CREATE OR REPLACE FUNCTION public.commit_teacher_ai_credits(
    p_reservation_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_res RECORD;
    v_wallet RECORD;
BEGIN
    SELECT * INTO v_res
    FROM public.credit_reservations
    WHERE id = p_reservation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'RESERVATION_NOT_FOUND');
    END IF;

    IF v_res.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_RESERVATION_STATUS', 'status', v_res.status);
    END IF;

    -- Đánh dấu hoàn tất
    UPDATE public.credit_reservations
    SET status = 'committed',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_reservation_id;

    -- Ghi nhận lượt sử dụng AI vào sổ theo dõi học sinh
    INSERT INTO public.student_ai_usage (
        student_id,
        classroom_id,
        teacher_id,
        action_type,
        usage_date,
        credits_deducted,
        reservation_id
    ) VALUES (
        v_res.student_id,
        v_res.classroom_id,
        v_res.user_id,
        v_res.action,
        (CURRENT_DATE AT TIME ZONE 'Asia/Ho_Chi_Minh'),
        v_res.amount,
        p_reservation_id
    );

    -- Ghi sổ cái ví giáo viên
    SELECT id INTO v_wallet FROM public.wallets WHERE user_id = v_res.user_id;
    IF FOUND THEN
        INSERT INTO public.wallet_txns (
            wallet_id,
            amount,
            type,
            description,
            ref_id
        ) VALUES (
            v_wallet.id,
            -v_res.amount,
            'ai_usage',
            'Trợ lý AI Luyện Bù cho học sinh trong lớp',
            p_reservation_id
        );
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 11.3 Hoàn trả Credits khi AI lỗi hoặc timeout (Refund)
CREATE OR REPLACE FUNCTION public.refund_teacher_ai_credits(
    p_reservation_id UUID,
    p_reason TEXT DEFAULT 'AI call failed or timeout'
)
RETURNS JSONB AS $$
DECLARE
    v_res RECORD;
    v_wallet RECORD;
    v_promo_deducted INT;
    v_purchased_deducted INT;
BEGIN
    SELECT * INTO v_res
    FROM public.credit_reservations
    WHERE id = p_reservation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'RESERVATION_NOT_FOUND');
    END IF;

    IF v_res.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'CANNOT_REFUND_NON_PENDING', 'status', v_res.status);
    END IF;

    v_promo_deducted := COALESCE((v_res.metadata->>'promo_deducted')::int, 0);
    v_purchased_deducted := v_res.amount - v_promo_deducted;

    -- Hoàn trả vào đúng các ngăn đã khấu trừ
    SELECT * INTO v_wallet
    FROM public.wallets
    WHERE user_id = v_res.user_id
    FOR UPDATE;

    IF FOUND THEN
        UPDATE public.wallets
        SET promotional_balance = promotional_balance + v_promo_deducted,
            purchased_balance = purchased_balance + v_purchased_deducted,
            balance = balance + v_res.amount,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_wallet.id;
    END IF;

    UPDATE public.credit_reservations
    SET status = 'refunded',
        metadata = v_res.metadata || jsonb_build_object('refund_reason', p_reason),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_reservation_id;

    RETURN jsonb_build_object('success', true, 'refunded_amount', v_res.amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.reserve_teacher_ai_credits(UUID, UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.commit_teacher_ai_credits(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refund_teacher_ai_credits(UUID, TEXT) TO authenticated, service_role;
