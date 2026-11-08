-- ==============================================================================
-- Migration: 20261118_p0_hotfix_security_and_ledger.sql
-- EdTeach P0 Hotfix: Security Hardening, RLS Lockdown & Ledger Integrity
--
-- Security Vulnerabilities Addressed:
-- 1. SEC-RLS-01: Enable RLS on public.remote_cam_pin_attempts to prevent PIN brute-force lockout resets.
-- 2. BE-01 / SEC-RLS-02: Drop overly permissive public SELECT on public.grading_sessions.
-- 3. SEC-RBAC-01 / FE-03: Extend trg_prevent_user_privilege_escalation to BEFORE INSERT OR UPDATE on public.users.
-- 4. BE-02 / WAL-03: Alter public.wallet_txns.ref_id to TEXT to store PayOS and other non-UUID transaction references.
-- ==============================================================================

-- 1. BẢO VỆ BẢNG REMOTE_CAM_PIN_ATTEMPTS (CHỐNG BRUTE FORCE PIN)
ALTER TABLE IF EXISTS public.remote_cam_pin_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service_role can manage pin attempts" ON public.remote_cam_pin_attempts;
CREATE POLICY "Only service_role can manage pin attempts"
    ON public.remote_cam_pin_attempts FOR ALL
    USING (current_user = 'service_role' OR COALESCE((auth.jwt()->>'role'), '') = 'service_role');

-- 2. SIẾT CHẶT ROW LEVEL SECURITY CHO BẢNG GRADING_SESSIONS
-- Thu hồi chính sách SELECT công khai vô điều kiện làm lộ đáp án và danh sách học sinh
DROP POLICY IF EXISTS "Public can view session by token or pin" ON public.grading_sessions;

-- Đảm bảo chỉ chính chủ Giáo viên sở hữu phiên mới được toàn quyền SELECT/INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Teachers can manage own sessions" ON public.grading_sessions;
CREATE POLICY "Teachers can manage own sessions"
    ON public.grading_sessions FOR ALL
    USING (auth.uid() = teacher_id OR auth.uid() = user_id)
    WITH CHECK (auth.uid() = teacher_id OR auth.uid() = user_id);

-- 3. CHẶN LEO THANG ĐẶC QUYỀN TOÀN DIỆN TRÊN PUBLIC.USERS (BEFORE INSERT OR UPDATE)
CREATE OR REPLACE FUNCTION public.prevent_user_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Nếu không phải là service_role, không cho phép sửa đổi các trường quyền hạn, kiểm duyệt và tiền bạc
    IF current_user <> 'service_role' AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN
        IF TG_OP = 'INSERT' THEN
            -- Mặc định người dùng mới tạo qua client luôn là role teacher/student, tier free, không có quyền admin/VIP
            IF NEW.role NOT IN ('teacher', 'student') OR NEW.role IS NULL THEN
                NEW.role := 'teacher';
            END IF;
            NEW.tier := 'free';
            NEW.is_verified_teacher := false;
            NEW.verified_at := NULL;
            NEW.verified_school := NULL;
            NEW.affiliate_balance := 0;
            NEW.total_affiliate_earned := 0;
            NEW.subscription_expires_at := NULL;
            
            IF NEW.preferences IS NOT NULL THEN
                NEW.preferences := NEW.preferences - 'subscription_tier' - 'tier' - 'role' - 'is_admin' - 'is_verified_teacher' - 'credits' - 'affiliate_balance';
            ELSE
                NEW.preferences := '{}'::jsonb;
            END IF;
        ELSE -- UPDATE
            NEW.role := OLD.role;
            NEW.tier := OLD.tier;
            NEW.referral_code := OLD.referral_code;
            NEW.is_verified_teacher := OLD.is_verified_teacher;
            NEW.verified_at := OLD.verified_at;
            NEW.verified_school := OLD.verified_school;
            NEW.affiliate_balance := OLD.affiliate_balance;
            NEW.total_affiliate_earned := OLD.total_affiliate_earned;
            NEW.subscription_expires_at := OLD.subscription_expires_at;

            -- Bảo vệ JSONB preferences: Ngăn người dùng tự gán subscription_tier ('max', 'pro', 'school') hoặc cờ VIP
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
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_user_privilege_escalation ON public.users;
CREATE TRIGGER trg_prevent_user_privilege_escalation
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.prevent_user_privilege_escalation();

-- 4. ĐỔI KIỂU CỘT REF_ID TRONG WALLET_TXNS SANG TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'wallet_txns' 
          AND column_name = 'ref_id' 
          AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.wallet_txns ALTER COLUMN ref_id TYPE TEXT USING ref_id::TEXT;
    END IF;
END $$;
