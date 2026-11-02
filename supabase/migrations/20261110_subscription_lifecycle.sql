-- ==============================================================================
-- Migration: 20261110_subscription_lifecycle.sql
-- Milestone 2 (PR 1.3): Subscription Expiry & Downgrade Lifecycle
--
-- Security & Business Logic Addressed:
-- 1. RC-13 / PRC-01: Auto-downgrade expired PRO/MAX accounts to FREE
-- 2. Performance: Partial index on subscription_expires_at for active subscribers
-- 3. Security: SECURITY DEFINER RPC with service_role execution restriction
-- ==============================================================================

-- 1. Partial index on users for fast scanning of expiring active subscribers
CREATE INDEX IF NOT EXISTS idx_users_subscription_expiry 
    ON public.users (subscription_expires_at) 
    WHERE tier <> 'free' AND subscription_expires_at IS NOT NULL;

-- 2. Hàm RPC nguyên tử quét và hạ hạng các tài khoản đã hết hạn
CREATE OR REPLACE FUNCTION public.downgrade_expired_subscriptions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
    v_downgraded_users JSONB := '[]'::jsonb;
BEGIN
    -- Tìm và cập nhật tất cả người dùng có tier khác 'free' mà subscription_expires_at <= NOW()
    WITH expired_users AS (
        SELECT id, email, tier, subscription_expires_at
        FROM public.users
        WHERE subscription_expires_at IS NOT NULL
          AND subscription_expires_at <= NOW()
          AND tier <> 'free'
    ),
    updated AS (
        UPDATE public.users u
        SET 
            tier = 'free',
            preferences = CASE 
                WHEN u.preferences IS NOT NULL THEN u.preferences - 'subscription_tier'
                ELSE '{}'::jsonb
            END,
            updated_at = NOW()
        FROM expired_users eu
        WHERE u.id = eu.id
        RETURNING u.id, u.email, eu.tier AS old_tier, u.subscription_expires_at
    )
    SELECT 
        COUNT(*),
        COALESCE(jsonb_agg(jsonb_build_object(
            'user_id', id,
            'email', email,
            'old_tier', old_tier,
            'expired_at', subscription_expires_at
        )), '[]'::jsonb)
    INTO v_count, v_downgraded_users
    FROM updated;

    RETURN jsonb_build_object(
        'success', true,
        'downgraded_count', v_count,
        'downgraded_users', v_downgraded_users,
        'executed_at', NOW()
    );
END;
$$;

-- 3. Phân quyền thực thi: Thu hồi khỏi public/anon/authenticated, chỉ cho phép service_role
REVOKE ALL ON FUNCTION public.downgrade_expired_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.downgrade_expired_subscriptions() TO service_role;
