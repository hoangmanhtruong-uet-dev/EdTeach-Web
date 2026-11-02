-- Migration: 20261116_referral_code_rpc.sql
-- Tra cứu mã giới thiệu an toàn, bypass RLS cho mọi người dùng đã đăng nhập

CREATE OR REPLACE FUNCTION public.lookup_referral_code(code_to_check TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    referral_code TEXT,
    referred_by UUID
)
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    clean_code TEXT;
    hex_prefix TEXT;
BEGIN
    clean_code := UPPER(TRIM(code_to_check));
    
    -- 1. Tìm theo cột referral_code chính xác
    RETURN QUERY
    SELECT u.id, u.name, u.referral_code, u.referred_by
    FROM public.users u
    WHERE UPPER(u.referral_code) = clean_code
    LIMIT 1;
    
    IF FOUND THEN
        RETURN;
    END IF;

    -- 2. Nếu mã có dạng EDU + 5 ký tự hex đầu của user ID (e.g. EDU8C01A)
    IF clean_code LIKE 'EDU%' AND LENGTH(clean_code) >= 7 THEN
        hex_prefix := LOWER(SUBSTRING(clean_code FROM 4));
        RETURN QUERY
        SELECT u.id, u.name, u.referral_code, u.referred_by
        FROM public.users u
        WHERE REPLACE(u.id::text, '-', '') ILIKE hex_prefix || '%'
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.lookup_referral_code(TEXT) TO authenticated, anon, service_role;
