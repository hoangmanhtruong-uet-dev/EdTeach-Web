-- ==============================================================================
-- Migration: 20261112_marketplace_atomic_escrow.sql
-- Milestone 3 (PR 2.2): Atomic Marketplace Purchase & 14-day Escrow Cycle
--
-- Security & Economic Vulnerabilities Addressed:
-- 1. RC-05 / MKT-03: Eliminate TOCTOU race conditions, double purchases, and
--    client update fallbacks during marketplace item purchases.
-- 2. RC-06 / ECO-01: Restrict marketplace purchases strictly to purchased_balance
--    (prevent promotional credits from being laundered into cash withdrawals).
-- 3. MKT-03: Price slippage guard (p_expected_price) to prevent buying at unexpected price.
-- 4. PR 2.2: 15% platform fee, 85% seller net earnings held in 14-day escrow
--    (public.marketplace_escrow_holds) releasing to withdrawable_revenue_vnd.
-- ==============================================================================

-- ==============================================================================
-- 1. ĐẢM BẢO CẤU TRÚC VÍ 3 NGĂN & RÀNG BUỘC TOÀN VẸN (DEFENSIVE IDEMPOTENCY)
-- ==============================================================================

ALTER TABLE public.wallets
    ADD COLUMN IF NOT EXISTS promotional_balance INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS purchased_balance INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS withdrawable_revenue_vnd BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS escrow_balance_vnd BIGINT NOT NULL DEFAULT 0;

-- Xóa các bản ghi mua trùng lặp cũ (nếu có) trước khi thiết lập UNIQUE constraint
DELETE FROM public.marketplace_purchases a USING public.marketplace_purchases b
WHERE a.id > b.id AND a.buyer_id = b.buyer_id AND a.item_id = b.item_id;

-- Ràng buộc UNIQUE chống mua trùng lặp song song (Double-purchase race condition prevention)
ALTER TABLE public.marketplace_purchases 
    DROP CONSTRAINT IF EXISTS uq_buyer_item_purchase;
ALTER TABLE public.marketplace_purchases 
    ADD CONSTRAINT uq_buyer_item_purchase UNIQUE (buyer_id, item_id);


-- ==============================================================================
-- 2. BẢNG QUẢN LÝ QUỸ TẠM GIỮ ESCROW 14 NGÀY (PUBLIC.MARKETPLACE_ESCROW_HOLDS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_escrow_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.marketplace_purchases(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    amount_vnd BIGINT NOT NULL CHECK (amount_vnd >= 0),
    status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
    release_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    released_at TIMESTAMPTZ
);

-- Ràng buộc mỗi đơn hàng mua chỉ có tối đa 1 bản ghi giữ Escrow
ALTER TABLE public.marketplace_escrow_holds
    DROP CONSTRAINT IF EXISTS uq_marketplace_escrow_holds_order;
ALTER TABLE public.marketplace_escrow_holds
    ADD CONSTRAINT uq_marketplace_escrow_holds_order UNIQUE (order_id);

-- Chỉ mục tối ưu hóa truy vấn cron và dashboard người bán
CREATE INDEX IF NOT EXISTS idx_escrow_holds_seller_status 
    ON public.marketplace_escrow_holds(seller_id, status);

CREATE INDEX IF NOT EXISTS idx_escrow_holds_matured_release 
    ON public.marketplace_escrow_holds(status, release_at) 
    WHERE status = 'held';

CREATE INDEX IF NOT EXISTS idx_escrow_holds_buyer 
    ON public.marketplace_escrow_holds(buyer_id);

CREATE INDEX IF NOT EXISTS idx_escrow_holds_item 
    ON public.marketplace_escrow_holds(item_id);

-- Kích hoạt RLS bảo mật thông tin tài chính
ALTER TABLE public.marketplace_escrow_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view their own escrow holds" ON public.marketplace_escrow_holds;
CREATE POLICY "Sellers can view their own escrow holds"
    ON public.marketplace_escrow_holds FOR SELECT
    USING ((SELECT auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Buyers can view escrow holds of their purchases" ON public.marketplace_escrow_holds;
CREATE POLICY "Buyers can view escrow holds of their purchases"
    ON public.marketplace_escrow_holds FOR SELECT
    USING ((SELECT auth.uid()) = buyer_id);

-- Thu hồi quyền ghi trực tiếp từ các vai trò client
REVOKE INSERT, UPDATE, DELETE ON public.marketplace_escrow_holds FROM anon, authenticated;
GRANT SELECT ON public.marketplace_escrow_holds TO authenticated;
GRANT ALL ON public.marketplace_escrow_holds TO service_role;


-- ==============================================================================
-- 3. HÀM ATOMIC PURCHASE V2 (PUBLIC.MARKETPLACE_PURCHASE_ITEM_V2)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.marketplace_purchase_item_v2(
    p_buyer_id UUID,
    p_item_id UUID,
    p_expected_price INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_buyer_id UUID;
    v_item RECORD;
    v_buyer_wallet RECORD;
    v_seller_wallet_id UUID;
    v_existing_purchase_id UUID;
    v_purchase_id UUID;
    v_escrow_hold_id UUID;
    v_platform_fee_credits INTEGER;
    v_platform_fee_vnd BIGINT;
    v_seller_net_credits INTEGER;
    v_seller_net_vnd BIGINT;
    v_release_at TIMESTAMPTZ;
BEGIN
    -- 1. Xác thực danh tính người mua
    IF p_buyer_id IS NOT NULL THEN
        IF current_user <> 'service_role' 
           AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' 
           AND p_buyer_id IS DISTINCT FROM auth.uid() THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'UNAUTHORIZED',
                'message', 'Bạn không có quyền thực hiện giao dịch cho tài khoản khác.'
            );
        END IF;
        v_buyer_id := p_buyer_id;
    ELSE
        v_buyer_id := auth.uid();
    END IF;

    IF v_buyer_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNAUTHORIZED',
            'message', 'Bạn cần đăng nhập để mua đề thi.'
        );
    END IF;

    -- 2. Khóa dòng đề thi với FOR UPDATE để kiểm tra trạng thái và giá
    SELECT id, seller_id, title, price_credits, status, downloads_count
    INTO v_item
    FROM public.marketplace_items
    WHERE id = p_item_id
    FOR UPDATE;

    IF NOT FOUND OR v_item.status <> 'published' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ITEM_NOT_FOUND',
            'message', 'Đề thi không tồn tại hoặc đã bị gỡ khỏi sàn.'
        );
    END IF;

    -- 3. Chặn tác giả tự mua đề của chính mình
    IF v_item.seller_id = v_buyer_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CANNOT_BUY_OWN_ITEM',
            'message', 'Thầy/Cô là tác giả của đề thi này, không cần mua.'
        );
    END IF;

    -- 4. Chặn trượt giá (Price Slippage Guard)
    IF p_expected_price IS NOT NULL AND v_item.price_credits <> p_expected_price THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'PRICE_SLIPPAGE',
            'message', 'Giá đề thi vừa được cập nhật từ ' || p_expected_price || ' thành ' || v_item.price_credits || ' credits. Vui lòng xác nhận lại.',
            'expected_price', p_expected_price,
            'actual_price', v_item.price_credits
        );
    END IF;

    -- 5. Kiểm tra quyền sở hữu trước đó (Idempotency)
    SELECT id INTO v_existing_purchase_id
    FROM public.marketplace_purchases
    WHERE buyer_id = v_buyer_id AND item_id = p_item_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_owned', true,
            'message', 'Thầy/Cô đã sở hữu đề thi này trước đó.',
            'purchase_id', v_existing_purchase_id,
            'price_credits', v_item.price_credits
        );
    END IF;

    -- 6. Xử lý trường hợp đề thi miễn phí (0 credits)
    IF v_item.price_credits = 0 THEN
        INSERT INTO public.marketplace_purchases (
            buyer_id, item_id, price_credits, commission_rate, seller_earnings, platform_fee, created_at
        ) VALUES (
            v_buyer_id, p_item_id, 0, 0, 0, 0, timezone('utc'::text, now())
        ) RETURNING id INTO v_purchase_id;

        UPDATE public.marketplace_items
        SET downloads_count = downloads_count + 1
        WHERE id = p_item_id;

        RETURN jsonb_build_object(
            'success', true,
            'already_owned', false,
            'message', 'Nhận đề thi miễn phí thành công!',
            'purchase_id', v_purchase_id,
            'item_id', p_item_id,
            'price_credits', 0
        );
    END IF;

    -- 7. Xử lý đề thi trả phí: Khóa ví người mua và kiểm tra purchased_balance
    SELECT id, purchased_balance, promotional_balance, balance
    INTO v_buyer_wallet
    FROM public.wallets
    WHERE user_id = v_buyer_id
    FOR UPDATE;

    IF NOT FOUND OR v_buyer_wallet.purchased_balance < v_item.price_credits THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INSUFFICIENT_PURCHASED_BALANCE',
            'message', 'Số dư nạp (purchased_balance) không đủ để mua đề thi trên chợ. Credits khuyến mãi không thể dùng mua đề thi.',
            'required', v_item.price_credits,
            'current_purchased_balance', COALESCE(v_buyer_wallet.purchased_balance, 0),
            'promotional_balance', COALESCE(v_buyer_wallet.promotional_balance, 0),
            'total_balance', COALESCE(v_buyer_wallet.balance, 0)
        );
    END IF;

    -- 8. Tính toán kinh tế: 15% phí sàn, 85% doanh thu tác giả (Quy đổi 1 credit = 100 VNĐ)
    v_seller_net_vnd := ROUND(v_item.price_credits * 100 * 0.85)::BIGINT;
    v_platform_fee_vnd := (v_item.price_credits * 100)::BIGINT - v_seller_net_vnd;
    v_seller_net_credits := ROUND(v_item.price_credits * 0.85)::INTEGER;
    v_platform_fee_credits := v_item.price_credits - v_seller_net_credits;
    v_release_at := timezone('utc'::text, now()) + interval '14 days';

    -- 9. Trừ tiền strictly từ purchased_balance người mua
    UPDATE public.wallets
    SET purchased_balance = purchased_balance - v_item.price_credits,
        balance = GREATEST(balance - v_item.price_credits, 0),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_buyer_wallet.id;

    -- Ghi sổ cái giao dịch người mua
    INSERT INTO public.wallet_txns (
        wallet_id, amount, type, description, ref_id, metadata, created_at
    ) VALUES (
        v_buyer_wallet.id,
        -v_item.price_credits,
        'marketplace_buy',
        'Mua đề thi: ' || v_item.title,
        p_item_id,
        jsonb_build_object(
            'item_id', p_item_id,
            'item_title', v_item.title,
            'price_credits', v_item.price_credits,
            'bucket', 'purchased_balance'
        ),
        timezone('utc'::text, now())
    );

    -- 10. Ghi nhận giao dịch mua vào bảng marketplace_purchases
    INSERT INTO public.marketplace_purchases (
        buyer_id, item_id, price_credits, commission_rate, seller_earnings, platform_fee, created_at
    ) VALUES (
        v_buyer_id,
        p_item_id,
        v_item.price_credits,
        0.15,
        v_seller_net_credits,
        v_platform_fee_credits,
        timezone('utc'::text, now())
    ) RETURNING id INTO v_purchase_id;

    -- 11. Đưa doanh thu của người bán vào ngăn escrow_balance_vnd và ghi nhận bản ghi giữ Escrow
    IF v_item.seller_id IS NOT NULL THEN
        INSERT INTO public.wallets (
            user_id, balance, purchased_balance, promotional_balance, withdrawable_revenue_vnd, escrow_balance_vnd, updated_at
        ) VALUES (
            v_item.seller_id, 0, 0, 0, 0, v_seller_net_vnd, timezone('utc'::text, now())
        ) ON CONFLICT (user_id) DO UPDATE
        SET escrow_balance_vnd = COALESCE(public.wallets.escrow_balance_vnd, 0) + v_seller_net_vnd,
            updated_at = timezone('utc'::text, now())
        RETURNING id INTO v_seller_wallet_id;

        INSERT INTO public.marketplace_escrow_holds (
            order_id, seller_id, buyer_id, item_id, amount_vnd, status, release_at, created_at
        ) VALUES (
            v_purchase_id,
            v_item.seller_id,
            v_buyer_id,
            p_item_id,
            v_seller_net_vnd,
            'held',
            v_release_at,
            timezone('utc'::text, now())
        ) RETURNING id INTO v_escrow_hold_id;

        -- Ghi nhận giao dịch bán đề đang tạm giữ vào sổ cái người bán
        INSERT INTO public.wallet_txns (
            wallet_id, amount, type, description, ref_id, metadata, created_at
        ) VALUES (
            v_seller_wallet_id,
            0,
            'marketplace_sell',
            'Bán đề thi (tạm giữ Escrow 14 ngày): ' || v_item.title,
            p_item_id,
            jsonb_build_object(
                'item_id', p_item_id,
                'purchase_id', v_purchase_id,
                'escrow_hold_id', v_escrow_hold_id,
                'amount_vnd', v_seller_net_vnd,
                'platform_fee_vnd', v_platform_fee_vnd,
                'release_at', v_release_at,
                'status', 'held'
            ),
            timezone('utc'::text, now())
        );
    END IF;

    -- 12. Tăng số lượt tải
    UPDATE public.marketplace_items
    SET downloads_count = downloads_count + 1
    WHERE id = p_item_id;

    -- 13. Phản hồi kết quả có cấu trúc hoàn chỉnh
    RETURN jsonb_build_object(
        'success', true,
        'already_owned', false,
        'message', 'Giao dịch mua đề thi thành công!',
        'purchase_id', v_purchase_id,
        'item_id', p_item_id,
        'price_credits', v_item.price_credits,
        'platform_fee_credits', v_platform_fee_credits,
        'platform_fee_vnd', v_platform_fee_vnd,
        'seller_net_vnd', v_seller_net_vnd,
        'escrow_hold_id', v_escrow_hold_id,
        'release_at', v_release_at,
        'new_purchased_balance', v_buyer_wallet.purchased_balance - v_item.price_credits
    );
END;
$$;

-- Overload hỗ trợ gọi 2 tham số (tự suy luận buyer từ auth.uid())
CREATE OR REPLACE FUNCTION public.marketplace_purchase_item_v2(
    p_item_id UUID,
    p_expected_price INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.marketplace_purchase_item_v2(
        p_buyer_id := auth.uid(),
        p_item_id := p_item_id,
        p_expected_price := p_expected_price
    );
END;
$$;

-- Wrapper tương thích ngược cho RPC cũ marketplace_purchase_item
CREATE OR REPLACE FUNCTION public.marketplace_purchase_item(
    p_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.marketplace_purchase_item_v2(
        p_buyer_id := auth.uid(),
        p_item_id := p_item_id,
        p_expected_price := NULL
    );
END;
$$;


-- ==============================================================================
-- 4. HÀM GIẢI TỎA QUỸ ESCROW ĐẾN HẠN (PUBLIC.RELEASE_MATURE_ESCROW_ATOMIC)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.release_mature_escrow_atomic(
    p_hold_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_hold RECORD;
    v_released_count INTEGER := 0;
    v_total_released_vnd BIGINT := 0;
    v_seller_wallet_id UUID;
BEGIN
    -- Chỉ service_role mới được phép gọi hàm này
    IF current_user <> 'service_role' AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNAUTHORIZED',
            'message', 'Chỉ hệ thống (service_role) mới có quyền giải tỏa quỹ Escrow.'
        );
    END IF;

    -- Quét và khóa các khoản giữ Escrow đã đến hạn (SKIP LOCKED chống tranh chấp đa tiến trình)
    FOR v_hold IN
        SELECT id, order_id, seller_id, buyer_id, item_id, amount_vnd, release_at
        FROM public.marketplace_escrow_holds
        WHERE (p_hold_id IS NULL OR id = p_hold_id)
          AND status = 'held'
          AND release_at <= timezone('utc'::text, now())
        ORDER BY id
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Chuyển tiền từ escrow_balance_vnd sang withdrawable_revenue_vnd
        UPDATE public.wallets
        SET escrow_balance_vnd = GREATEST(escrow_balance_vnd - v_hold.amount_vnd, 0),
            withdrawable_revenue_vnd = withdrawable_revenue_vnd + v_hold.amount_vnd,
            updated_at = timezone('utc'::text, now())
        WHERE user_id = v_hold.seller_id
        RETURNING id INTO v_seller_wallet_id;

        -- Đánh dấu bản ghi Escrow đã giải tỏa
        UPDATE public.marketplace_escrow_holds
        SET status = 'released',
            released_at = timezone('utc'::text, now())
        WHERE id = v_hold.id;

        -- Ghi sổ cái wallet_txns cho người bán
        IF v_seller_wallet_id IS NOT NULL THEN
            INSERT INTO public.wallet_txns (
                wallet_id,
                amount,
                type,
                description,
                ref_id,
                metadata,
                created_at
            ) VALUES (
                v_seller_wallet_id,
                0,
                'marketplace_sell',
                'Giải tỏa doanh thu bán đề từ Escrow vào số dư khả dụng rút',
                v_hold.item_id,
                jsonb_build_object(
                    'action', 'escrow_release',
                    'escrow_hold_id', v_hold.id,
                    'order_id', v_hold.order_id,
                    'amount_vnd', v_hold.amount_vnd,
                    'released_at', timezone('utc'::text, now())
                ),
                timezone('utc'::text, now())
            );
        END IF;

        v_released_count := v_released_count + 1;
        v_total_released_vnd := v_total_released_vnd + v_hold.amount_vnd;
    END LOOP;

    IF p_hold_id IS NOT NULL AND v_released_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'HOLD_NOT_ELIGIBLE',
            'message', 'Khoản giữ Escrow không tồn tại, chưa đến hạn hoặc đã được giải tỏa trước đó.',
            'hold_id', p_hold_id
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'released_count', v_released_count,
        'total_released_vnd', v_total_released_vnd,
        'processed_at', timezone('utc'::text, now())
    );
END;
$$;


-- ==============================================================================
-- 5. CẤP QUYỀN THI HÀNH (GRANTS)
-- ==============================================================================

GRANT EXECUTE ON FUNCTION public.marketplace_purchase_item_v2(UUID, UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.marketplace_purchase_item_v2(UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.marketplace_purchase_item(UUID) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.release_mature_escrow_atomic(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_mature_escrow_atomic(UUID) TO service_role;
