-- ========================================================
-- EduTest AI - Sprint 6: Production Hardening, Live Classroom & Feedback
-- 1. Siết bảo mật RPC deduct_user_credits (chặn giả mạo p_user_id)
-- 2. Bảng live_poll_sessions & live_poll_votes (Bục Giảng Số Live Poll 1-Chạm)
-- 3. Bảng in_app_feedback (Tiếp nhận góp ý & báo lỗi giai đoạn Beta)
-- 4. Kích hoạt RLS & cấp quyền bảo vệ dữ liệu
-- ========================================================

-- 1. VÁ BẢO MẬT HÀM TRỪ CREDITS (RPC SECURITY DEFINER)
-- Ngăn người dùng đăng nhập gọi RPC để trừ ví của người dùng khác
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT '',
    p_ref_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_balance INTEGER;
    v_wallet_id UUID;
    v_new_balance INTEGER;
BEGIN
    -- Kiểm tra quyền: Chỉ cho phép chính chủ hoặc service_role thực hiện
    IF p_user_id IS DISTINCT FROM auth.uid() 
       AND current_user <> 'service_role' 
       AND (auth.jwt()->>'role') IS DISTINCT FROM 'service_role' THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'UNAUTHORIZED_ACCESS', 
            'message', 'Bạn không có quyền thao tác trên ví của tài khoản khác.'
        );
    END IF;

    -- Khóa hàng ví của user bằng FOR UPDATE để loại bỏ triệt để Race Condition
    SELECT id, balance INTO v_wallet_id, v_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'WALLET_NOT_FOUND');
    END IF;

    IF v_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_CREDITS', 'balance', v_balance);
    END IF;

    v_new_balance := v_balance - p_amount;

    UPDATE public.wallets
    SET balance = v_new_balance,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- Ghi sổ giao dịch ví bất biến
    INSERT INTO public.credit_transactions (
        wallet_id,
        user_id,
        amount,
        balance_after,
        type,
        description,
        reference_id
    ) VALUES (
        v_wallet_id,
        p_user_id,
        -p_amount,
        v_new_balance,
        'deduct',
        p_description,
        p_ref_id
    );

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. BẢNG LIVE_POLL_SESSIONS (Phiên bình chọn Bục Giảng Số)
CREATE TABLE IF NOT EXISTS public.live_poll_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(16) NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT,
    exam_id TEXT,
    question_index INTEGER NOT NULL DEFAULT 1,
    question_title TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '["A", "B", "C", "D"]'::jsonb,
    correct_answer VARCHAR(10),
    is_open BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_live_poll_room_code ON public.live_poll_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_live_poll_teacher_id ON public.live_poll_sessions(teacher_id);


-- 3. BẢNG LIVE_POLL_VOTES (Lượt bình chọn thời gian thực của học sinh)
CREATE TABLE IF NOT EXISTS public.live_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.live_poll_sessions(id) ON DELETE CASCADE,
    room_code VARCHAR(16) NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    selected_option VARCHAR(10) NOT NULL,
    is_correct BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(poll_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_live_poll_votes_poll_id ON public.live_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_live_poll_votes_room ON public.live_poll_votes(room_code);


-- 4. BẢNG IN_APP_FEEDBACK (Tiếp nhận phản hồi và báo lỗi người dùng)
CREATE TABLE IF NOT EXISTS public.in_app_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    role VARCHAR(32) DEFAULT 'teacher',
    category VARCHAR(64) NOT NULL, -- 'feature_request', 'exam_error', 'omr_error', 'payment_issue', 'other'
    title TEXT,
    content TEXT NOT NULL,
    page_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'closed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_in_app_feedback_status ON public.in_app_feedback(status);
CREATE INDEX IF NOT EXISTS idx_in_app_feedback_user ON public.in_app_feedback(user_id);


-- 5. KÍCH HOẠT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.live_poll_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_feedback ENABLE ROW LEVEL SECURITY;

-- Policy live_poll_sessions:
-- Mọi người có thể đọc phiên bình chọn qua room_code
DROP POLICY IF EXISTS "Public can view active poll by room" ON public.live_poll_sessions;
CREATE POLICY "Public can view active poll by room"
    ON public.live_poll_sessions FOR SELECT
    USING (true);

-- Giáo viên có quyền tạo và đóng phiên bình chọn của chính mình
DROP POLICY IF EXISTS "Teachers can manage own live polls" ON public.live_poll_sessions;
CREATE POLICY "Teachers can manage own live polls"
    ON public.live_poll_sessions FOR ALL
    USING (auth.uid()::text = teacher_id OR current_user = 'service_role')
    WITH CHECK (auth.uid()::text = teacher_id OR current_user = 'service_role');

-- Policy live_poll_votes:
-- Học sinh có thể gửi bình chọn của mình
DROP POLICY IF EXISTS "Students can submit votes" ON public.live_poll_votes;
CREATE POLICY "Students can submit votes"
    ON public.live_poll_votes FOR INSERT
    WITH CHECK (true);

-- Cho phép đọc tổng hợp lượt bình chọn
DROP POLICY IF EXISTS "Public can view votes summary" ON public.live_poll_votes;
CREATE POLICY "Public can view votes summary"
    ON public.live_poll_votes FOR SELECT
    USING (true);

-- Policy in_app_feedback:
-- Mọi người dùng có thể gửi góp ý
DROP POLICY IF EXISTS "Users can submit feedback" ON public.in_app_feedback;
CREATE POLICY "Users can submit feedback"
    ON public.in_app_feedback FOR INSERT
    WITH CHECK (true);

-- Chỉ admin hoặc service_role mới được xem toàn bộ góp ý
DROP POLICY IF EXISTS "Admins can view feedback" ON public.in_app_feedback;
CREATE POLICY "Admins can view feedback"
    ON public.in_app_feedback FOR SELECT
    USING (
        current_user = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );
