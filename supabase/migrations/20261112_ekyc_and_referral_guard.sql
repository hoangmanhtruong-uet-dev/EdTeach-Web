-- ==============================================================================
-- Migration: 20261112_ekyc_and_referral_guard.sql
-- Milestone 3 (PR 2.3): Anti-Repetition eKYC & Verified Referral Qualification
--
-- Security Vulnerabilities Addressed:
-- 1. RC-06 / SET-03: Prevent multiple claims of teacher verification bonus (+10k credits).
-- 2. RC-09 / SET-03: Disable heuristic OCR auto-approval loop; force manual review on failure.
-- 3. RC-06 / AFF-06 / CRT-06: Gate referral bonus credits (+2,000 credits) behind verified
--    first exam creation, preventing bot farm / fake registration credit inflation.
-- ==============================================================================

-- ==============================================================================
-- 1. MỞ RỘNG BẢNG PUBLIC.USERS VỚI EKYC_REWARDED_AT
-- ==============================================================================

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS ekyc_rewarded_at TIMESTAMPTZ;

-- Backfill: Gán ekyc_rewarded_at cho các giáo viên đã được cấp Tích Xanh trước đó
UPDATE public.users
SET ekyc_rewarded_at = COALESCE(verified_at, created_at, timezone('utc'::text, now()))
WHERE is_verified_teacher = true AND ekyc_rewarded_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_ekyc_rewarded_at 
    ON public.users(ekyc_rewarded_at) 
    WHERE ekyc_rewarded_at IS NOT NULL;

-- Cập nhật trigger chặn leo thang đặc quyền để bảo vệ ekyc_rewarded_at
CREATE OR REPLACE FUNCTION public.prevent_user_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Nếu không phải là service_role, không cho phép sửa đổi các trường quyền hạn, kiểm duyệt và tiền bạc
    IF current_user <> 'service_role' AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        NEW.role := OLD.role;
        NEW.tier := OLD.tier;
        NEW.referral_code := OLD.referral_code;
        NEW.is_verified_teacher := OLD.is_verified_teacher;
        NEW.verified_at := OLD.verified_at;
        NEW.verified_school := OLD.verified_school;
        NEW.ekyc_rewarded_at := OLD.ekyc_rewarded_at; -- Khóa cờ nhận thưởng eKYC
        NEW.affiliate_balance := OLD.affiliate_balance;
        NEW.total_affiliate_earned := OLD.total_affiliate_earned;
        NEW.subscription_expires_at := OLD.subscription_expires_at;

        -- Bảo vệ JSONB preferences
        IF NEW.preferences IS DISTINCT FROM OLD.preferences THEN
            IF NEW.preferences IS NOT NULL THEN
                NEW.preferences := NEW.preferences - 'subscription_tier' - 'tier' - 'role' - 'is_admin' - 'is_verified_teacher' - 'credits' - 'affiliate_balance';
                IF OLD.preferences IS NOT NULL AND OLD.preferences ? 'subscription_tier' THEN
                    NEW.preferences := jsonb_set(NEW.preferences, '{subscription_tier}', OLD.preferences->'subscription_tier');
                END IF;
            ELSE
                NEW.preferences := COALESCE(OLD.preferences, '{}'::jsonb);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 2. MỞ RỘNG BẢNG TEACHER_VERIFICATIONS & CHỐNG SUBMISSION SPAM
-- ==============================================================================

ALTER TABLE public.teacher_verifications
    ADD COLUMN IF NOT EXISTS rewarded_at TIMESTAMPTZ;

-- Backfill rewarded_at cho các hồ sơ đã approved
UPDATE public.teacher_verifications
SET rewarded_at = COALESCE(reviewed_at, updated_at, created_at)
WHERE status = 'approved' AND rewarded_at IS NULL;

-- Ngăn một người dùng có 2 hồ sơ đang ở trạng thái pending_review cùng lúc
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_verifications_one_pending
    ON public.teacher_verifications (user_id)
    WHERE status = 'pending_review';

-- Ngăn một người dùng có 2 hồ sơ đã approved
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_verifications_one_approved
    ON public.teacher_verifications (user_id)
    WHERE status = 'approved';

-- ==============================================================================
-- 3. MỞ RỘNG BẢNG REFERRALS VỚI QUALIFICATION TRACKING
-- ==============================================================================

ALTER TABLE public.referrals
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'qualified', 'rewarded', 'cancelled')),
    ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rewarded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS qualifying_exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Backfill: Toàn bộ referrals lịch sử được đánh dấu là 'rewarded'
UPDATE public.referrals
SET status = 'rewarded',
    qualified_at = COALESCE(created_at, timezone('utc'::text, now())),
    rewarded_at = COALESCE(created_at, timezone('utc'::text, now()))
WHERE status = 'pending' AND created_at < timezone('utc'::text, now()) - INTERVAL '1 hour';

CREATE INDEX IF NOT EXISTS idx_referrals_invitee_pending
    ON public.referrals (invitee_id)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_referrals_inviter_status
    ON public.referrals (inviter_id, status);

-- ==============================================================================
-- 4. ATOMIC RPC: CLAIM_EKYC_REWARD_ATOMIC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.claim_ekyc_reward_atomic(
    p_user_id UUID,
    p_admin_id UUID DEFAULT NULL,
    p_verification_id UUID DEFAULT NULL,
    p_school_name TEXT DEFAULT NULL,
    p_teacher_code TEXT DEFAULT NULL,
    p_role_category TEXT DEFAULT 'teacher'
)
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_wallet RECORD;
    v_bonus_amount INTEGER := 10000;
    v_has_promo_col BOOLEAN := false;
BEGIN
    -- 1. Khóa hàng và kiểm tra trạng thái người dùng
    SELECT id, is_verified_teacher, ekyc_rewarded_at, verified_school, verified_teacher_code
    INTO v_user
    FROM public.users
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'user_not_found',
            'message', 'Không tìm thấy tài khoản người dùng.'
        );
    END IF;

    -- 2. Kiểm tra chống nhận thưởng kép
    IF v_user.ekyc_rewarded_at IS NOT NULL THEN
        -- Bảo đảm cờ is_verified_teacher được đồng bộ nhưng KHÔNG cộng thêm credit
        UPDATE public.users
        SET is_verified_teacher = true,
            verified_school = COALESCE(p_school_name, v_user.verified_school, 'Đơn vị giáo dục'),
            verified_teacher_code = COALESCE(p_teacher_code, v_user.verified_teacher_code),
            role = CASE WHEN p_role_category = 'tutor' THEN 'tutor' ELSE 'teacher' END
        WHERE id = p_user_id;

        IF p_verification_id IS NOT NULL THEN
            UPDATE public.teacher_verifications
            SET status = 'approved',
                admin_reviewed_by = p_admin_id,
                reviewed_at = timezone('utc'::text, now()),
                updated_at = timezone('utc'::text, now())
            WHERE id = p_verification_id;
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'already_rewarded', true,
            'credits_awarded', 0,
            'message', 'Tài khoản đã nhận thưởng eKYC trước đó. Đã xác nhận Tích Xanh chính chủ mà không cộng thêm điểm thưởng lặp.'
        );
    END IF;

    -- 3. Cập nhật hồ sơ người dùng kèm cờ ekyc_rewarded_at
    UPDATE public.users
    SET is_verified_teacher = true,
        verified_at = timezone('utc'::text, now()),
        ekyc_rewarded_at = timezone('utc'::text, now()),
        verified_school = COALESCE(p_school_name, v_user.verified_school, 'Đơn vị giáo dục'),
        verified_teacher_code = COALESCE(p_teacher_code, v_user.verified_teacher_code, 'VERIFIED-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
        organization_name = COALESCE(p_school_name, v_user.verified_school, 'Đơn vị giáo dục'),
        role = CASE WHEN p_role_category = 'tutor' THEN 'tutor' ELSE 'teacher' END
    WHERE id = p_user_id;

    -- 4. Cập nhật hồ sơ verification
    IF p_verification_id IS NOT NULL THEN
        UPDATE public.teacher_verifications
        SET status = 'approved',
            admin_reviewed_by = p_admin_id,
            reviewed_at = timezone('utc'::text, now()),
            rewarded_at = timezone('utc'::text, now()),
            updated_at = timezone('utc'::text, now())
        WHERE id = p_verification_id;
    END IF;

    -- 5. Nạp +10.000 credits vào ví (ưu tiên promotional_balance nếu có mô hình 3 ngăn)
    SELECT id, balance
    INTO v_wallet
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.wallets (user_id, balance, daily_quota, daily_quota_used)
        VALUES (p_user_id, v_bonus_amount, 10, 0)
        RETURNING id, balance INTO v_wallet;
    ELSE
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'wallets' 
              AND column_name = 'promotional_balance'
        ) INTO v_has_promo_col;

        IF v_has_promo_col THEN
            EXECUTE 'UPDATE public.wallets SET promotional_balance = promotional_balance + $1, balance = balance + $1, updated_at = timezone(''utc''::text, now()) WHERE id = $2'
            USING v_bonus_amount, v_wallet.id;
        ELSE
            UPDATE public.wallets
            SET balance = balance + v_bonus_amount,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_wallet.id;
        END IF;
    END IF;

    -- 6. Ghi nhật ký chuẩn xác vào wallet_txns (type: 'ekyc_bonus')
    INSERT INTO public.wallet_txns (
        wallet_id,
        amount,
        type,
        description,
        metadata
    ) VALUES (
        v_wallet.id,
        v_bonus_amount,
        'ekyc_bonus',
        'Thưởng hoàn tất xác thực danh tính giáo viên chính chủ (Tích Xanh eKYC) (+10.000 credits)',
        jsonb_build_object(
            'verification_id', p_verification_id,
            'reviewed_by', p_admin_id,
            'role_category', p_role_category,
            'school_name', p_school_name
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'already_rewarded', false,
        'credits_awarded', v_bonus_amount,
        'message', 'Đã kích hoạt Tích Xanh chính chủ và cộng thành công +10.000 credits vào tài khoản giáo viên.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 5. ATOMIC RPC: QUALIFY_AND_REWARD_REFERRAL_ATOMIC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.qualify_and_reward_referral_atomic(
    p_invitee_id UUID,
    p_exam_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_referral RECORD;
    v_inviter_wallet RECORD;
    v_invitee_wallet RECORD;
    v_reward_credits INTEGER;
    v_has_promo_col BOOLEAN := false;
    v_exam RECORD;
BEGIN
    -- 1. Tìm referral đang pending của invitee
    SELECT id, inviter_id, invitee_id, reward_credits, status
    INTO v_referral
    FROM public.referrals
    WHERE invitee_id = p_invitee_id AND status = 'pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'qualified', false,
            'reason', 'no_pending_referral',
            'message', 'Không có khoản thưởng giới thiệu nào đang chờ kích hoạt.'
        );
    END IF;

    -- 2. Kiểm tra tính hợp lệ của đề thi đủ điều kiện (question_count > 0, status = 'completed')
    SELECT id, status, question_count, user_id
    INTO v_exam
    FROM public.exams
    WHERE id = p_exam_id;

    IF NOT FOUND OR v_exam.user_id <> p_invitee_id OR v_exam.status <> 'completed' OR COALESCE(v_exam.question_count, 0) <= 0 THEN
        RETURN jsonb_build_object(
            'qualified', false,
            'reason', 'invalid_qualifying_exam',
            'message', 'Đề thi chưa hợp lệ hoặc chưa hoàn tất tạo câu hỏi để kích hoạt thưởng giới thiệu.'
        );
    END IF;

    v_reward_credits := COALESCE(v_referral.reward_credits, 2000);

    -- 3. Cập nhật trạng thái referral sang 'rewarded'
    UPDATE public.referrals
    SET status = 'rewarded',
        qualified_at = timezone('utc'::text, now()),
        rewarded_at = timezone('utc'::text, now()),
        qualifying_exam_id = p_exam_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_referral.id;

    -- Kiểm tra sự tồn tại của cột promotional_balance
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'wallets' 
          AND column_name = 'promotional_balance'
    ) INTO v_has_promo_col;

    -- 4. Trả thưởng cho Người giới thiệu (Inviter)
    SELECT id, balance
    INTO v_inviter_wallet
    FROM public.wallets
    WHERE user_id = v_referral.inviter_id
    FOR UPDATE;

    IF FOUND THEN
        IF v_has_promo_col THEN
            EXECUTE 'UPDATE public.wallets SET promotional_balance = promotional_balance + $1, balance = balance + $1, updated_at = timezone(''utc''::text, now()) WHERE id = $2'
            USING v_reward_credits, v_inviter_wallet.id;
        ELSE
            UPDATE public.wallets
            SET balance = balance + v_reward_credits,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_inviter_wallet.id;
        END IF;

        INSERT INTO public.wallet_txns (
            wallet_id,
            amount,
            type,
            description,
            ref_id,
            metadata
        ) VALUES (
            v_inviter_wallet.id,
            v_reward_credits,
            'referral_bonus',
            'Thưởng giới thiệu đồng nghiệp: người được giới thiệu đã hoàn thành đề thi đầu tiên (+' || v_reward_credits || ' credits)',
            v_referral.id::text,
            jsonb_build_object(
                'invitee_id', p_invitee_id,
                'exam_id', p_exam_id,
                'referral_id', v_referral.id
            )
        );
    END IF;

    -- 5. Trả thưởng cho Người được giới thiệu (Invitee)
    SELECT id, balance
    INTO v_invitee_wallet
    FROM public.wallets
    WHERE user_id = p_invitee_id
    FOR UPDATE;

    IF FOUND THEN
        IF v_has_promo_col THEN
            EXECUTE 'UPDATE public.wallets SET promotional_balance = promotional_balance + $1, balance = balance + $1, updated_at = timezone(''utc''::text, now()) WHERE id = $2'
            USING v_reward_credits, v_invitee_wallet.id;
        ELSE
            UPDATE public.wallets
            SET balance = balance + v_reward_credits,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_invitee_wallet.id;
        END IF;

        INSERT INTO public.wallet_txns (
            wallet_id,
            amount,
            type,
            description,
            ref_id,
            metadata
        ) VALUES (
            v_invitee_wallet.id,
            v_reward_credits,
            'referral_bonus',
            'Thưởng tạo đề thi đầu tiên qua mã giới thiệu của đồng nghiệp (+' || v_reward_credits || ' credits)',
            p_exam_id::text,
            jsonb_build_object(
                'inviter_id', v_referral.inviter_id,
                'exam_id', p_exam_id,
                'referral_id', v_referral.id
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'qualified', true,
        'referral_id', v_referral.id,
        'inviter_id', v_referral.inviter_id,
        'invitee_id', p_invitee_id,
        'reward_credits', v_reward_credits,
        'message', 'Đã xác thực đề thi đầu tiên thành công! Thưởng giới thiệu +' || v_reward_credits || ' credits đã được giải phóng vào ví cả 2 tài khoản.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 6. CẤP QUYỀN THI HÀNH (GRANTS)
-- ==============================================================================

GRANT EXECUTE ON FUNCTION public.claim_ekyc_reward_atomic(UUID, UUID, UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.qualify_and_reward_referral_atomic(UUID, UUID) TO authenticated, service_role;
