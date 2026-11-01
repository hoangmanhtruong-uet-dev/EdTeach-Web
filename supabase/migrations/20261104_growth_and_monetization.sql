-- ========================================================
-- EduTest AI - Sprint 4: Growth & Monetization Engine Migration
-- ========================================================

-- 1. Bổ sung các trường quản lý hoa hồng và thời hạn gói trong bảng users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS affiliate_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_affiliate_earned NUMERIC(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Đảm bảo index cho tra cứu referral_code và referred_by
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);

-- 2. Bảng Lịch sử Hoa hồng (Affiliate Commissions)
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_code TEXT NOT NULL,
    order_amount NUMERIC(12, 2) NOT NULL,
    commission_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.20,
    commission_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_inviter ON public.affiliate_commissions(inviter_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_order ON public.affiliate_commissions(order_code);

-- 3. Bảng Yêu cầu Rút tiền Hoa hồng (Affiliate Payouts)
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    payout_type TEXT NOT NULL CHECK (payout_type IN ('cash', 'credits')),
    amount_vnd NUMERIC(12, 2) NOT NULL,
    credits_received INTEGER DEFAULT 0,
    bank_code TEXT,
    bank_account TEXT,
    bank_account_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
    admin_note TEXT,
    reference_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_user ON public.affiliate_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON public.affiliate_payouts(status);

-- 4. Bật Row Level Security (RLS)
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Policy cho affiliate_commissions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'affiliate_commissions' AND policyname = 'Users can view their own commissions'
    ) THEN
        CREATE POLICY "Users can view their own commissions"
            ON public.affiliate_commissions FOR SELECT
            USING (auth.uid() = inviter_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'affiliate_commissions' AND policyname = 'Service role manages commissions'
    ) THEN
        CREATE POLICY "Service role manages commissions"
            ON public.affiliate_commissions FOR ALL
            USING (auth.jwt()->>'role' = 'service_role' OR auth.role() = 'service_role');
    END IF;
END $$;

-- Policy cho affiliate_payouts
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'affiliate_payouts' AND policyname = 'Users can view and create their own payouts'
    ) THEN
        CREATE POLICY "Users can view and create their own payouts"
            ON public.affiliate_payouts FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'affiliate_payouts' AND policyname = 'Admin can review all payouts'
    ) THEN
        CREATE POLICY "Admin can review all payouts"
            ON public.affiliate_payouts FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND (email LIKE '%admin%' OR email = 'truongcri0101@gmail.com')
                )
            );
    END IF;
END $$;
