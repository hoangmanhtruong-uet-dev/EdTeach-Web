-- ==============================================================================
-- Migration: 20261111_three_bucket_wallets.sql
-- Milestone 3 (PR 2.1): 3-Bucket Wallet Architecture & Arbitrage Removal
--
-- Security Vulnerabilities Addressed:
-- 1. RC-06 / ECO-01 / ECO-02 / ECO-03: Split public.wallets into 3 distinct balance
--    buckets + 1 escrow buffer to permanently eliminate cash arbitrage:
--    - promotional_balance: Free credits (signup, referral, eKYC), non-withdrawable,
--      used first for internal AI operations, cannot buy on marketplace.
--    - purchased_balance: Paid credits (packages, topup), non-withdrawable,
--      used second for internal AI operations and marketplace purchases.
--    - withdrawable_revenue_vnd: Real VND cash earnings (marketplace seller revenue,
--      affiliate commission), withdrawable via VietQR >= 200.000 VNĐ.
--    - escrow_balance_vnd: 14-day escrow buffer for pending marketplace sales.
-- 2. RC-06 / WAL-01 / WAL-02: Backward-compatible sync trigger maintaining
--    wallets.balance = promotional_balance + purchased_balance without breaking legacy queries.
-- 3. RC-06 / MKT-01 / AFF-01: Enforce CHECK (amount_vnd >= 200000) on payout tables.
-- 4. RC-05 / CRT-04 / CRT-05: Update deduct_user_credits_atomic to deduct from
--    promotional_balance first, then purchased_balance.
-- ==============================================================================

-- ==============================================================================
-- 1. THÊM 4 CỘT NGĂN VÍ MỚI & RÀNG BUỘC CHECK KHÔNG ÂM
-- ==============================================================================

ALTER TABLE public.wallets 
    ADD COLUMN IF NOT EXISTS promotional_balance INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS purchased_balance INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS withdrawable_revenue_vnd BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS escrow_balance_vnd BIGINT NOT NULL DEFAULT 0;

-- Xóa các check constraints cũ nếu có để tránh xung đột
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.wallets'::regclass
          AND contype = 'c'
          AND conname IN (
              'wallets_promotional_balance_check',
              'wallets_purchased_balance_check',
              'wallets_withdrawable_revenue_vnd_check',
              'wallets_escrow_balance_vnd_check'
          )
    ) LOOP
        EXECUTE 'ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Áp dụng các ràng buộc CHECK không âm trên từng ngăn
ALTER TABLE public.wallets
    ADD CONSTRAINT wallets_promotional_balance_check CHECK (promotional_balance >= 0),
    ADD CONSTRAINT wallets_purchased_balance_check CHECK (purchased_balance >= 0),
    ADD CONSTRAINT wallets_withdrawable_revenue_vnd_check CHECK (withdrawable_revenue_vnd >= 0),
    ADD CONSTRAINT wallets_escrow_balance_vnd_check CHECK (escrow_balance_vnd >= 0);


-- ==============================================================================
-- 2. DI TRÚ DỮ LIỆU SỐ DƯ HIỆN TẠI VÀO CÁC NGĂN TƯƠNG ỨNG (DATA RECONCILIATION)
-- ==============================================================================

-- Phân bổ số dư hiện tại của người dùng:
-- - Số tiền nạp thực tế từ sổ cái (topup, purchase > 0) -> purchased_balance (tối đa bằng balance hiện có)
-- - Phần số dư còn lại (signup_bonus, referral_bonus, ekyc_bonus) -> promotional_balance
-- - Số dư hoa hồng affiliate hiện có trong users -> withdrawable_revenue_vnd
-- - escrow_balance_vnd khởi tạo bằng 0
UPDATE public.wallets w
SET 
    purchased_balance = LEAST(
        GREATEST(0, w.balance), 
        COALESCE((
            SELECT GREATEST(0, SUM(t.amount))
            FROM public.wallet_txns t
            WHERE t.wallet_id = w.id
              AND t.type IN ('topup', 'purchase')
              AND t.amount > 0
        ), 0)
    ),
    promotional_balance = GREATEST(
        0, 
        w.balance - LEAST(
            GREATEST(0, w.balance), 
            COALESCE((
                SELECT GREATEST(0, SUM(t.amount))
                FROM public.wallet_txns t
                WHERE t.wallet_id = w.id
                  AND t.type IN ('topup', 'purchase')
                  AND t.amount > 0
            ), 0)
        )
    ),
    withdrawable_revenue_vnd = COALESCE((
        SELECT GREATEST(0, u.affiliate_balance::bigint)
        FROM public.users u
        WHERE u.id = w.user_id
    ), 0),
    escrow_balance_vnd = 0,
    updated_at = timezone('utc'::text, now())
WHERE w.promotional_balance = 0 AND w.purchased_balance = 0 AND w.balance > 0;


-- ==============================================================================
-- 3. TRIGGER ĐỒNG BỘ 2 CHIỀU TƯƠNG THÍCH NGƯỢC (BACKWARD-COMPATIBLE SYNC TRIGGER)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sync_wallet_three_buckets()
RETURNS TRIGGER AS $$
DECLARE
    v_diff INTEGER;
BEGIN
    -- Xử lý khi INSERT ví mới
    IF (TG_OP = 'INSERT') THEN
        IF NEW.promotional_balance = 0 AND NEW.purchased_balance = 0 AND NEW.balance > 0 THEN
            NEW.promotional_balance := NEW.balance;
        END IF;
        NEW.balance := NEW.promotional_balance + NEW.purchased_balance;
        NEW.updated_at := timezone('utc'::text, now());
        RETURN NEW;
    END IF;

    -- Xử lý khi UPDATE ví hiện có
    -- Trường hợp 1: Mã nguồn mới cập nhật trực tiếp promotional_balance hoặc purchased_balance
    IF NEW.promotional_balance IS DISTINCT FROM OLD.promotional_balance 
       OR NEW.purchased_balance IS DISTINCT FROM OLD.purchased_balance THEN
        NEW.balance := NEW.promotional_balance + NEW.purchased_balance;

    -- Trường hợp 2: Mã nguồn cũ (legacy code) cập nhật trực tiếp cột balance
    ELSIF NEW.balance IS DISTINCT FROM OLD.balance THEN
        v_diff := NEW.balance - OLD.balance;
        IF v_diff > 0 THEN
            -- Cộng thêm: Mặc định đưa vào purchased_balance (nạp tiền)
            NEW.purchased_balance := OLD.purchased_balance + v_diff;
        ELSE
            -- Giảm bớt: Trừ promotional_balance trước, phần còn thiếu trừ purchased_balance
            IF OLD.promotional_balance >= ABS(v_diff) THEN
                NEW.promotional_balance := OLD.promotional_balance - ABS(v_diff);
            ELSE
                NEW.promotional_balance := 0;
                NEW.purchased_balance := GREATEST(0, OLD.purchased_balance - (ABS(v_diff) - OLD.promotional_balance));
            END IF;
        END IF;
        NEW.balance := NEW.promotional_balance + NEW.purchased_balance;

    -- Trường hợp 3: Cập nhật các trường khác (withdrawable_revenue_vnd, daily_quota...)
    ELSE
        NEW.balance := NEW.promotional_balance + NEW.purchased_balance;
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_sync_wallet_three_buckets ON public.wallets;
CREATE TRIGGER trg_sync_wallet_three_buckets
    BEFORE INSERT OR UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_three_buckets();


-- ==============================================================================
-- 4. SIẾT CHẶT HẠN MỨC RÚT TIỀN TỐI THIỂU 200.000 VNĐ (RC-06, MKT-01, AFF-01)
-- ==============================================================================

-- 4.1 Áp dụng ràng buộc CHECK trên bảng payout_requests
ALTER TABLE public.payout_requests
    DROP CONSTRAINT IF EXISTS payout_requests_min_amount_check;

ALTER TABLE public.payout_requests
    ADD CONSTRAINT payout_requests_min_amount_check 
    CHECK (amount_vnd >= 200000);

-- 4.2 Áp dụng ràng buộc CHECK trên bảng affiliate_payouts
ALTER TABLE public.affiliate_payouts
    DROP CONSTRAINT IF EXISTS affiliate_payouts_min_amount_check;

ALTER TABLE public.affiliate_payouts
    ADD CONSTRAINT affiliate_payouts_min_amount_check 
    CHECK (amount_vnd >= 200000);


-- ==============================================================================
-- 5. CẬP NHẬT HÀM DEDUCT_USER_CREDITS_ATOMIC: ƯU TIÊN TRỪ PROMOTIONAL TRƯỚC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.deduct_user_credits_atomic(
    p_user_id UUID,
    p_amount INTEGER,
    p_action TEXT DEFAULT 'generate_exam',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_total_available INTEGER;
    v_deduct_promo INTEGER := 0;
    v_deduct_purchased INTEGER := 0;
    v_new_promo INTEGER;
    v_new_purchased INTEGER;
    v_new_balance INTEGER;
    v_txn_type TEXT;
    v_description TEXT;
    v_ref_id UUID;
    v_txn_id UUID;
    v_strict BOOLEAN;
BEGIN
    -- 5.1 Kiểm tra tham số đầu vào hợp lệ
    IF p_amount IS NULL OR p_amount < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_AMOUNT',
            'message', 'Số credits cần trừ phải là số nguyên không âm.'
        );
    END IF;

    -- 5.2 Kiểm tra quyền hạn: Chỉ chính chủ hoặc service_role được thực hiện
    IF p_user_id IS DISTINCT FROM auth.uid() 
       AND current_user <> 'service_role' 
       AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'UNAUTHORIZED_ACCESS', 
            'message', 'Bạn không có quyền thao tác trên ví của tài khoản khác.'
        );
    END IF;

    -- 5.3 Khóa dòng ví người dùng bằng FOR UPDATE chống Race Condition / Double Spending
    SELECT * INTO v_wallet
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

    -- 5.4 Tính toán số dư khả dụng cho AI (promotional_balance + purchased_balance)
    -- Doanh thu tiền mặt (withdrawable_revenue_vnd) không dùng cho tác vụ AI
    v_total_available := COALESCE(v_wallet.promotional_balance, 0) + COALESCE(v_wallet.purchased_balance, 0);

    v_strict := COALESCE((p_metadata->>'strict')::boolean, (p_metadata->>'raise_on_error')::boolean, false);
    IF v_total_available < p_amount THEN
        IF v_strict THEN
            RAISE EXCEPTION 'INSUFFICIENT_CREDITS: Cần % credits, số dư khả dụng hiện tại % credits.', p_amount, v_total_available;
        END IF;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INSUFFICIENT_CREDITS',
            'balance', v_total_available,
            'promotional_balance', COALESCE(v_wallet.promotional_balance, 0),
            'purchased_balance', COALESCE(v_wallet.purchased_balance, 0),
            'required', p_amount,
            'message', 'Số dư credits không đủ để thực hiện thao tác.'
        );
    END IF;

    -- 5.5 Khấu trừ theo thứ tự ưu tiên: promotional_balance TRƯỚC -> purchased_balance SAU
    v_deduct_promo := LEAST(COALESCE(v_wallet.promotional_balance, 0), p_amount);
    v_deduct_purchased := p_amount - v_deduct_promo;

    v_new_promo := COALESCE(v_wallet.promotional_balance, 0) - v_deduct_promo;
    v_new_purchased := COALESCE(v_wallet.purchased_balance, 0) - v_deduct_purchased;
    v_new_balance := v_new_promo + v_new_purchased;

    -- 5.6 Cập nhật số dư 3 ngăn trong bảng wallets
    UPDATE public.wallets
    SET 
        promotional_balance = v_new_promo,
        purchased_balance = v_new_purchased,
        balance = v_new_balance,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_wallet.id;

    -- 5.7 Chuẩn hóa loại giao dịch & trích xuất mô tả
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

    -- 5.8 Ghi sổ cái giao dịch với metadata ghi nhận chi tiết nguồn tiền khấu trừ
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
            v_wallet.id,
            -p_amount,
            v_txn_type,
            v_description,
            v_ref_id,
            COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
                'deducted_promo', v_deduct_promo,
                'deducted_purchased', v_deduct_purchased
            ),
            timezone('utc'::text, now())
        ) RETURNING id INTO v_txn_id;
    END IF;

    -- 5.9 Trả về kết quả JSON chuẩn xác
    RETURN jsonb_build_object(
        'success', true,
        'balance', v_new_balance,
        'new_balance', v_new_balance,
        'previous_balance', v_total_available,
        'promotional_balance', v_new_promo,
        'purchased_balance', v_new_purchased,
        'deducted_promo', v_deduct_promo,
        'deducted_purchased', v_deduct_purchased,
        'deducted', p_amount,
        'action', p_action,
        'txn_id', v_txn_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ==============================================================================
-- 6. CẬP NHẬT HÀM REFUND_USER_CREDITS_ATOMIC: HOÀN VÀO ĐÚNG NGĂN NGUỒN
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.refund_user_credits_atomic(
    p_user_id UUID,
    p_amount INTEGER,
    p_action TEXT DEFAULT 'refund',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_refund_purchased INTEGER;
    v_refund_promo INTEGER;
    v_new_promo INTEGER;
    v_new_purchased INTEGER;
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

    SELECT * INTO v_wallet
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

    -- Xác định số lượng hoàn trả cho từng ngăn dựa trên metadata giao dịch trước
    v_refund_purchased := COALESCE((p_metadata->>'deducted_purchased')::integer, 0);
    v_refund_promo := COALESCE((p_metadata->>'deducted_promo')::integer, p_amount - v_refund_purchased);

    IF (v_refund_promo + v_refund_purchased) <> p_amount THEN
        v_refund_promo := p_amount;
        v_refund_purchased := 0;
    END IF;

    v_new_promo := COALESCE(v_wallet.promotional_balance, 0) + v_refund_promo;
    v_new_purchased := COALESCE(v_wallet.purchased_balance, 0) + v_refund_purchased;
    v_new_balance := v_new_promo + v_new_purchased;

    UPDATE public.wallets
    SET 
        promotional_balance = v_new_promo,
        purchased_balance = v_new_purchased,
        balance = v_new_balance,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_wallet.id;

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
        v_wallet.id,
        p_amount,
        'refund',
        v_description,
        v_ref_id,
        COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
            'refunded_promo', v_refund_promo,
            'refunded_purchased', v_refund_purchased
        ),
        timezone('utc'::text, now())
    ) RETURNING id INTO v_txn_id;

    RETURN jsonb_build_object(
        'success', true,
        'balance', v_new_balance,
        'new_balance', v_new_balance,
        'promotional_balance', v_new_promo,
        'purchased_balance', v_new_purchased,
        'refunded', p_amount,
        'txn_id', v_txn_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ==============================================================================
-- 7. XÂY DỰNG HÀM RPC TRỪ VÀ HOÀN DOANH THU RÚT TIỀN NGUYÊN TỬ
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.deduct_withdrawable_revenue_atomic(
    p_user_id UUID,
    p_amount_vnd BIGINT,
    p_payout_type TEXT DEFAULT 'marketplace',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_new_revenue BIGINT;
    v_txn_id UUID;
    v_description TEXT;
BEGIN
    -- 7.1 Kiểm tra hạn mức tối thiểu 200.000 VNĐ
    IF p_amount_vnd IS NULL OR p_amount_vnd < 200000 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'MINIMUM_PAYOUT_THRESHOLD_NOT_MET',
            'message', 'Hạn mức rút tiền tối thiểu là 200.000 VNĐ.'
        );
    END IF;

    -- 7.2 Kiểm tra quyền thực thi (chính chủ hoặc service_role)
    IF p_user_id IS DISTINCT FROM auth.uid() 
       AND current_user <> 'service_role' 
       AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNAUTHORIZED_ACCESS',
            'message', 'Bạn không có quyền thao tác trên ví của tài khoản khác.'
        );
    END IF;

    -- 7.3 Khóa dòng ví người dùng chống Race Condition
    SELECT * INTO v_wallet
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

    -- 7.4 Kiểm tra số dư doanh thu khả dụng
    IF COALESCE(v_wallet.withdrawable_revenue_vnd, 0) < p_amount_vnd THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INSUFFICIENT_WITHDRAWABLE_REVENUE',
            'withdrawable_revenue_vnd', COALESCE(v_wallet.withdrawable_revenue_vnd, 0),
            'required', p_amount_vnd,
            'message', 'Số dư doanh thu khả dụng không đủ để rút tiền.'
        );
    END IF;

    -- 7.5 Khấu trừ doanh thu khả dụng
    v_new_revenue := v_wallet.withdrawable_revenue_vnd - p_amount_vnd;
    UPDATE public.wallets
    SET 
        withdrawable_revenue_vnd = v_new_revenue,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_wallet.id;

    -- 7.6 Ghi sổ cái giao dịch
    v_description := COALESCE(
        p_metadata->>'description',
        'Yêu cầu rút tiền mặt ' || p_amount_vnd || ' VNĐ (' || p_payout_type || ')'
    );

    INSERT INTO public.wallet_txns (
        wallet_id,
        amount,
        type,
        description,
        metadata,
        created_at
    ) VALUES (
        v_wallet.id,
        0, -- Giao dịch tiền mặt VNĐ, không làm thay đổi credits AI
        'payout_request',
        v_description,
        COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
            'payout_amount_vnd', p_amount_vnd,
            'payout_type', p_payout_type,
            'remaining_revenue_vnd', v_new_revenue
        ),
        timezone('utc'::text, now())
    ) RETURNING id INTO v_txn_id;

    RETURN jsonb_build_object(
        'success', true,
        'withdrawable_revenue_vnd', v_new_revenue,
        'previous_revenue_vnd', v_wallet.withdrawable_revenue_vnd,
        'deducted_amount_vnd', p_amount_vnd,
        'txn_id', v_txn_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.refund_withdrawable_revenue_atomic(
    p_user_id UUID,
    p_amount_vnd BIGINT,
    p_reason TEXT DEFAULT 'payout_rejected',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_new_revenue BIGINT;
    v_txn_id UUID;
    v_description TEXT;
BEGIN
    IF p_amount_vnd IS NULL OR p_amount_vnd <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_AMOUNT',
            'message', 'Số tiền hoàn lại phải lớn hơn 0.'
        );
    END IF;

    IF current_user <> 'service_role' AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNAUTHORIZED_ACCESS',
            'message', 'Chỉ có service_role mới có quyền hoàn doanh thu tiền mặt.'
        );
    END IF;

    SELECT * INTO v_wallet
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

    v_new_revenue := COALESCE(v_wallet.withdrawable_revenue_vnd, 0) + p_amount_vnd;
    UPDATE public.wallets
    SET 
        withdrawable_revenue_vnd = v_new_revenue,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_wallet.id;

    v_description := COALESCE(
        p_metadata->>'description',
        'Hoàn lại tiền mặt ' || p_amount_vnd || ' VNĐ: ' || p_reason
    );

    INSERT INTO public.wallet_txns (
        wallet_id,
        amount,
        type,
        description,
        metadata,
        created_at
    ) VALUES (
        v_wallet.id,
        0,
        'payout_refund',
        v_description,
        COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
            'refunded_amount_vnd', p_amount_vnd,
            'reason', p_reason,
            'new_revenue_vnd', v_new_revenue
        ),
        timezone('utc'::text, now())
    ) RETURNING id INTO v_txn_id;

    RETURN jsonb_build_object(
        'success', true,
        'withdrawable_revenue_vnd', v_new_revenue,
        'previous_revenue_vnd', v_wallet.withdrawable_revenue_vnd,
        'refunded_amount_vnd', p_amount_vnd,
        'txn_id', v_txn_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ==============================================================================
-- 8. CẬP NHẬT TRIGGER HANDLE_NEW_USER KHỞI TẠO ĐỦ 3 NGĂN SỐ DƯ
-- ==============================================================================

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

    -- Tạo ví cho người dùng: 5.000 promotional credits ban đầu
    INSERT INTO public.wallets (
        user_id, 
        promotional_balance, 
        purchased_balance, 
        withdrawable_revenue_vnd, 
        escrow_balance_vnd, 
        balance, 
        daily_quota, 
        daily_quota_used, 
        last_quota_reset
    )
    VALUES (
        NEW.id, 
        5000, 
        0, 
        0, 
        0, 
        5000, 
        3, 
        0, 
        timezone('utc'::text, now())
    )
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
            'Quà tặng chào mừng thành viên mới (5.000 promotional credits)',
            jsonb_build_object('action', 'signup', 'bucket', 'promotional'),
            timezone('utc'::text, now())
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ==============================================================================
-- 9. CẤP QUYỀN THI HÀNH (GRANTS)
-- ==============================================================================

GRANT EXECUTE ON FUNCTION public.deduct_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_withdrawable_revenue_atomic(UUID, BIGINT, TEXT, JSONB) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.refund_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) TO service_role;
REVOKE EXECUTE ON FUNCTION public.refund_withdrawable_revenue_atomic(UUID, BIGINT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_withdrawable_revenue_atomic(UUID, BIGINT, TEXT, JSONB) TO service_role;

-- Thêm index hỗ trợ tìm kiếm nhanh theo số dư khả dụng
CREATE INDEX IF NOT EXISTS idx_wallets_withdrawable_revenue 
    ON public.wallets(withdrawable_revenue_vnd) 
    WHERE withdrawable_revenue_vnd >= 200000;
