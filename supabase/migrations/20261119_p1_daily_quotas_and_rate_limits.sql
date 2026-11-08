-- ==============================================================================
-- Migration: 20261119_p1_daily_quotas_and_rate_limits.sql
-- EdTeach P1: Persistent Quotas, Rate Limiting & AI Usage Governance
--
-- Security Vulnerabilities & Resilience Addressed:
-- 1. BE-08: Move in-memory RAM rate limits and free tier daily exam generation
--    quotas to persistent PostgreSQL storage to prevent serverless cold start bypass.
-- 2. SEC-RATE-01: Provide atomic check-and-increment RPC for IP and user quotas.
-- ==============================================================================

-- 1. BẢNG DAILY_USAGE_QUOTAS
CREATE TABLE IF NOT EXISTS public.daily_usage_quotas (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Chỉ mục tối ưu hóa tra cứu theo user và ngày
CREATE INDEX IF NOT EXISTS idx_daily_usage_quotas_user_date 
    ON public.daily_usage_quotas(user_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_usage_quotas_action_date 
    ON public.daily_usage_quotas(action, date);

-- Bật Row Level Security
ALTER TABLE public.daily_usage_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily quotas" ON public.daily_usage_quotas;
CREATE POLICY "Users can view own daily quotas"
    ON public.daily_usage_quotas FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages daily quotas" ON public.daily_usage_quotas;
CREATE POLICY "Service role manages daily quotas"
    ON public.daily_usage_quotas FOR ALL
    USING (current_user = 'service_role' OR COALESCE((auth.jwt()->>'role'), '') = 'service_role');

-- 2. ATOMIC RPC: CHECK_AND_INCREMENT_QUOTA
-- Kiểm tra và tăng hạn ngạch nguyên tử, trả về trạng thái allowed (true/false)
CREATE OR REPLACE FUNCTION public.check_and_increment_quota(
    p_key TEXT,
    p_user_id UUID DEFAULT NULL,
    p_action TEXT DEFAULT 'general',
    p_limit INTEGER DEFAULT 5
)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER;
    v_allowed BOOLEAN;
BEGIN
    INSERT INTO public.daily_usage_quotas (id, user_id, action, date, count, updated_at)
    VALUES (p_key, p_user_id, p_action, CURRENT_DATE, 1, timezone('utc'::text, now()))
    ON CONFLICT (id) DO UPDATE
    SET count = public.daily_usage_quotas.count + 1,
        updated_at = timezone('utc'::text, now())
    RETURNING count INTO v_count;

    IF v_count > p_limit THEN
        v_allowed := false;
    ELSE
        v_allowed := true;
    END IF;

    RETURN jsonb_build_object(
        'allowed', v_allowed,
        'count', v_count,
        'limit', p_limit,
        'remaining', GREATEST(0, p_limit - v_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.check_and_increment_quota(TEXT, UUID, TEXT, INTEGER) TO authenticated, service_role, anon;
