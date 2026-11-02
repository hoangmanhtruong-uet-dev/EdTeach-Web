-- ==============================================================================
-- Migration: 20261110_fix_wallet_ledger_and_rpc.sql
-- Milestone 2 (PR 1.2): Wallet Ledger Integrity & Atomic RPC Hardening
--
-- Security Vulnerabilities Addressed:
-- 1. RC-05 / SEC-06 / WAL-02: Expand wallet_txns_type_check to support all
--    platform transaction types without throwing check constraint violations.
-- 2. RC-05 / CRT-04 / CRT-05: Deploy atomic RPC deduct_user_credits_atomic with
--    row-level locking (FOR UPDATE), permission verification, and non-negative
--    balance enforcement.
-- 3. WAL-02: Enforce strict CHECK (balance >= 0) constraint on public.wallets.
-- 4. WAL-02: Reconcile missing signup bonus records in wallet_txns for new
--    and existing users.
-- ==============================================================================

-- ==============================================================================
-- 1. MỞ RỘNG CỘT & CHUẨN HÓA BẢNG PUBLIC.WALLET_TXNS
-- ==============================================================================

-- 1.1 Bổ sung cột metadata JSONB để lưu trữ ngữ cảnh giao dịch (model, tokens, action, etc.)
ALTER TABLE public.wallet_txns 
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 1.2 Làm sạch dữ liệu cũ: Chuẩn hóa bất kỳ bản ghi nào có type không hợp lệ về 'adjustment'
UPDATE public.wallet_txns
SET type = 'adjustment'
WHERE type IS NULL OR type NOT IN (
    'signup_bonus',
    'generate_exam',
    'export',
    'purchase',
    'refund',
    'marketplace_buy',
    'marketplace_sell',
    'topup',
    'payout_request',
    'payout_refund',
    'referral_bonus',
    'bonus',
    'ekyc_bonus',
    'subscription_grant',
    'ai_usage',
    'adjustment',
    'admin_grant'
);

-- 1.3 Xóa toàn bộ check constraint cũ liên quan đến cột type trên bảng wallet_txns
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.wallet_txns'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%type%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.wallet_txns DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 1.4 Thêm ràng buộc CHECK mới hỗ trợ đầy đủ 17 loại giao dịch của hệ thống
ALTER TABLE public.wallet_txns
    ADD CONSTRAINT wallet_txns_type_check
    CHECK (type IN (
        'signup_bonus',
        'generate_exam',
        'export',
        'purchase',
        'refund',
        'marketplace_buy',
        'marketplace_sell',
        'topup',
        'payout_request',
        'payout_refund',
        'referral_bonus',
        'bonus',
        'ekyc_bonus',
        'subscription_grant',
        'ai_usage',
        'adjustment',
        'admin_grant'
    ));

-- 1.5 Tối ưu hóa chỉ mục cho truy vấn lịch sử giao dịch và phân trang
CREATE INDEX IF NOT EXISTS idx_wallet_txns_wallet_created 
    ON public.wallet_txns(wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_txns_type 
    ON public.wallet_txns(type);


-- ==============================================================================
-- 2. SIẾT RÀNG BUỘC SỐ DƯ KHÔNG ÂM TRÊN PUBLIC.WALLETS
-- ==============================================================================

-- 2.1 Xử lý các số dư âm bất thường (nếu có do race condition trước đây)
UPDATE public.wallets
SET balance = 0, updated_at = timezone('utc'::text, now())
WHERE balance < 0;

-- 2.2 Xóa check constraint cũ về balance (nếu có)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.wallets'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%balance%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 2.3 Áp dụng ràng buộc bất biến số dư ví không được âm
ALTER TABLE public.wallets
    ADD CONSTRAINT wallets_balance_check CHECK (balance >= 0);

-- 2.4 Đảm bảo hạn mức ngày cũng không âm
ALTER TABLE public.wallets
    DROP CONSTRAINT IF EXISTS wallets_daily_quota_check;

ALTER TABLE public.wallets
    ADD CONSTRAINT wallets_daily_quota_check 
    CHECK (daily_quota >= 0 AND daily_quota_used >= 0);


-- ==============================================================================
-- 3. ĐỒNG BỘ VÀ KHỞI TẠO SỔ CÁI BẢNG WALLET_TXNS CHO MỌI TÀI KHOẢN (WAL-02)
-- ==============================================================================

-- 3.1 Bổ sung giao dịch khởi tạo số dư (signup_bonus) cho các ví đã có balance > 0 nhưng chưa có bản ghi sổ cái nào
INSERT INTO public.wallet_txns (wallet_id, amount, type, description, metadata, created_at)
SELECT 
    w.id,
    w.balance,
    'signup_bonus',
    'Khởi tạo số dư ban đầu cho tài khoản',
    jsonb_build_object('source', 'migration_20261110_reconciliation'),
    w.created_at
FROM public.wallets w
WHERE NOT EXISTS (
    SELECT 1 FROM public.wallet_txns t WHERE t.wallet_id = w.id
)
AND w.balance > 0;

-- 3.2 Cập nhật trigger handle_new_user để luôn ghi nhận bản ghi sổ cái khi tạo ví người dùng mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_wallet_id UUID;
    ref_code TEXT;
BEGIN
    ref_code := 'EDU' || upper(substr(replace(NEW.id::text, '-', ''), 1, 5));

    -- Tạo profile người dùng nếu chưa có
    INSERT INTO public.users (id, email, name, avatar_url, referral_code, tier, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, 'teacher@eduteach.vn'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Thầy Cô'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        ref_code,
        'free',
        'teacher'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Tạo ví cho người dùng
    INSERT INTO public.wallets (user_id, balance, daily_quota, daily_quota_used, last_quota_reset)
    VALUES (NEW.id, 5000, 3, 0, timezone('utc'::text, now()))
    ON CONFLICT (user_id) DO UPDATE
    SET updated_at = timezone('utc'::text, now())
    RETURNING id INTO new_wallet_id;

    -- Luôn ghi nhận giao dịch chào mừng vào sổ cái wallet_txns
    IF new_wallet_id IS NOT NULL THEN
        INSERT INTO public.wallet_txns (wallet_id, amount, type, description, metadata, created_at)
        VALUES (
            new_wallet_id,
            5000,
            'signup_bonus',
            'Quà tặng chào mừng thành viên mới (5.000 credits)',
            jsonb_build_object('action', 'signup'),
            timezone('utc'::text, now())
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ==============================================================================
-- 4. XÂY DỰNG HÀM RPC TRỪ CREDITS NGUYÊN TỬ (DEDUCT_USER_CREDITS_ATOMIC)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.deduct_user_credits_atomic(
    p_user_id UUID,
    p_amount INTEGER,
    p_action TEXT DEFAULT 'generate_exam',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_balance INTEGER;
    v_wallet_id UUID;
    v_new_balance INTEGER;
    v_txn_type TEXT;
    v_description TEXT;
    v_ref_id UUID;
    v_txn_id UUID;
    v_strict BOOLEAN;
BEGIN
    -- 4.1 Kiểm tra tham số đầu vào hợp lệ
    IF p_amount IS NULL OR p_amount < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_AMOUNT',
            'message', 'Số credits cần trừ phải là số nguyên không âm.'
        );
    END IF;

    -- 4.2 Kiểm tra quyền hạn: Chỉ chính chủ hoặc service_role được thực hiện
    IF p_user_id IS DISTINCT FROM auth.uid() 
       AND current_user <> 'service_role' 
       AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'UNAUTHORIZED_ACCESS', 
            'message', 'Bạn không có quyền thao tác trên ví của tài khoản khác.'
        );
    END IF;

    -- 4.3 Khóa dòng ví người dùng bằng FOR UPDATE chống Race Condition / Double Spending
    SELECT id, balance INTO v_wallet_id, v_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'WALLET_NOT_FOUND',
            'message', 'Không tìm thấy thông tin ví của người dùng.'
        );
    END IF;

    -- 4.4 Kiểm tra số dư khả dụng
    v_strict := COALESCE((p_metadata->>'strict')::boolean, (p_metadata->>'raise_on_error')::boolean, false);
    IF v_balance < p_amount THEN
        IF v_strict THEN
            RAISE EXCEPTION 'INSUFFICIENT_CREDITS: Cần % credits, số dư hiện tại % credits.', p_amount, v_balance;
        END IF;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INSUFFICIENT_CREDITS',
            'balance', v_balance,
            'new_balance', v_balance,
            'required', p_amount,
            'message', 'Số dư credits không đủ để thực hiện thao tác.'
        );
    END IF;

    -- 4.5 Cập nhật số dư ví mới
    v_new_balance := v_balance - p_amount;
    UPDATE public.wallets
    SET balance = v_new_balance,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_wallet_id;

    -- 4.6 Chuẩn hóa loại giao dịch & trích xuất mô tả
    IF p_action IN (
        'signup_bonus', 'generate_exam', 'export', 'purchase', 'refund',
        'marketplace_buy', 'marketplace_sell', 'topup', 'payout_request',
        'payout_refund', 'referral_bonus', 'bonus', 'ekyc_bonus',
        'subscription_grant', 'ai_usage', 'adjustment', 'admin_grant'
    ) THEN
        v_txn_type := p_action;
    ELSE
        v_txn_type := 'ai_usage';
    END IF;

    v_description := COALESCE(
        p_metadata->>'description',
        CASE 
            WHEN p_action = 'generate_exam' THEN 'Tạo đề thi tự động bằng AI'
            WHEN p_action = 'ai_usage' THEN 'Sử dụng tính năng AI'
            WHEN p_action = 'export' THEN 'Xuất bản đề thi'
            WHEN p_action = 'marketplace_buy' THEN 'Mua tài liệu trên Marketplace'
            ELSE 'Khấu trừ credits: ' || p_action
        END
    );

    IF (p_metadata->>'ref_id') IS NOT NULL AND (p_metadata->>'ref_id') ~ '^[0-9a-fA-F-]{36}$' THEN
        v_ref_id := (p_metadata->>'ref_id')::uuid;
    ELSE
        v_ref_id := NULL;
    END IF;

    -- 4.7 Ghi sổ cái giao dịch nếu amount > 0
    IF p_amount > 0 THEN
        INSERT INTO public.wallet_txns (
            wallet_id,
            amount,
            type,
            description,
            ref_id,
            metadata,
            created_at
        ) VALUES (
            v_wallet_id,
            -p_amount,
            v_txn_type,
            v_description,
            v_ref_id,
            COALESCE(p_metadata, '{}'::jsonb),
            timezone('utc'::text, now())
        ) RETURNING id INTO v_txn_id;
    END IF;

    -- 4.8 Trả về kết quả JSON chuẩn xác
    RETURN jsonb_build_object(
        'success', true,
        'balance', v_new_balance,
        'new_balance', v_new_balance,
        'previous_balance', v_balance,
        'deducted', p_amount,
        'action', p_action,
        'txn_id', v_txn_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ==============================================================================
-- 5. HÀM WRAPPER TƯƠNG THÍCH NGƯỢC: DEDUCT_USER_CREDITS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.deduct_user_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT '',
    p_ref_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_meta JSONB;
BEGIN
    v_meta := jsonb_build_object(
        'description', p_description,
        'ref_id', p_ref_id
    );
    RETURN public.deduct_user_credits_atomic(
        p_user_id := p_user_id,
        p_amount := p_amount,
        p_action := 'generate_exam',
        p_metadata := v_meta
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ==============================================================================
-- 6. HÀM RPC HOÀN CREDITS NGUYÊN TỬ: REFUND_USER_CREDITS_ATOMIC & REFUND_USER_CREDITS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.refund_user_credits_atomic(
    p_user_id UUID,
    p_amount INTEGER,
    p_action TEXT DEFAULT 'refund',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_balance INTEGER;
    v_wallet_id UUID;
    v_new_balance INTEGER;
    v_description TEXT;
    v_ref_id UUID;
    v_txn_id UUID;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_AMOUNT',
            'message', 'Số credits hoàn lại phải lớn hơn 0.'
        );
    END IF;

    IF current_user <> 'service_role' AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNAUTHORIZED_ACCESS',
            'message', 'Chỉ có service_role mới có quyền thực hiện hoàn credits.'
        );
    END IF;

    SELECT id, balance INTO v_wallet_id, v_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'WALLET_NOT_FOUND',
            'message', 'Không tìm thấy thông tin ví của người dùng.'
        );
    END IF;

    v_new_balance := v_balance + p_amount;
    UPDATE public.wallets
    SET balance = v_new_balance,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_wallet_id;

    v_description := COALESCE(
        p_metadata->>'description',
        'Hoàn lại credits giao dịch'
    );

    IF (p_metadata->>'ref_id') IS NOT NULL AND (p_metadata->>'ref_id') ~ '^[0-9a-fA-F-]{36}$' THEN
        v_ref_id := (p_metadata->>'ref_id')::uuid;
    ELSE
        v_ref_id := NULL;
    END IF;

    INSERT INTO public.wallet_txns (
        wallet_id,
        amount,
        type,
        description,
        ref_id,
        metadata,
        created_at
    ) VALUES (
        v_wallet_id,
        p_amount,
        'refund',
        v_description,
        v_ref_id,
        COALESCE(p_metadata, '{}'::jsonb),
        timezone('utc'::text, now())
    ) RETURNING id INTO v_txn_id;

    RETURN jsonb_build_object(
        'success', true,
        'balance', v_new_balance,
        'new_balance', v_new_balance,
        'refunded', p_amount,
        'txn_id', v_txn_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.refund_user_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT '',
    p_ref_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_metadata JSONB;
BEGIN
    v_metadata := jsonb_build_object(
        'description', p_description,
        'ref_id', p_ref_id
    );
    RETURN public.refund_user_credits_atomic(
        p_user_id := p_user_id,
        p_amount := p_amount,
        p_action := 'refund',
        p_metadata := v_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ==============================================================================
-- 7. CẤP QUYỀN THI HÀNH (GRANTS)
-- ==============================================================================

GRANT EXECUTE ON FUNCTION public.deduct_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_user_credits(UUID, INTEGER, TEXT, UUID) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.refund_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.refund_user_credits(UUID, INTEGER, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_user_credits(UUID, INTEGER, TEXT, UUID) TO service_role;
