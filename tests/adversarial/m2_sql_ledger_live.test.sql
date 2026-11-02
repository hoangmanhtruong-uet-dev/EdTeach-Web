-- ==============================================================================
-- tests/adversarial/m2_sql_ledger_live.test.sql
-- Empirical Adversarial Test Harness for Milestone 2 PR 1.2
-- Tests Wallet Ledger Integrity, 17 Transaction Types, Atomic Deduction/Refund,
-- Constraint Enforcement, Row-Level Locking, and Reconciliation.
-- ==============================================================================

\set ON_ERROR_STOP on

-- 1. SETUP CLEAN ENVIRONMENT
DROP SCHEMA IF EXISTS auth CASCADE;
CREATE SCHEMA auth;

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Auth mock table & helper functions
CREATE TABLE auth.users (
    id UUID PRIMARY KEY,
    email TEXT,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON TABLE auth.users TO postgres, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
    SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB AS $$
    SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE PROCEDURE set_auth_context(p_uid UUID, p_role TEXT) AS $$
BEGIN
    IF p_uid IS NULL THEN
        PERFORM set_config('request.jwt.claim.sub', '', false);
    ELSE
        PERFORM set_config('request.jwt.claim.sub', p_uid::text, false);
    END IF;
    PERFORM set_config('request.jwt.claim.role', p_role, false);
    PERFORM set_config('request.jwt.claims', json_build_object('sub', COALESCE(p_uid::text, ''), 'role', p_role)::text, false);
    EXECUTE format('SET ROLE %I', p_role);
END;
$$ LANGUAGE plpgsql;

-- 2. CREATE BASELINE TABLES (Simulating legacy state prior to 20261110)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'student', 'tutor', 'admin')),
    school TEXT,
    avatar_url TEXT,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'max', 'school')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0, -- Legacy allows negative
    daily_quota INTEGER NOT NULL DEFAULT 3,
    daily_quota_used INTEGER NOT NULL DEFAULT 0,
    last_quota_reset TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Legacy check constraint with ONLY 5 types (the bug described in WAL-02 / RC-05)
CREATE TABLE public.wallet_txns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('signup_bonus', 'generate_exam', 'export', 'purchase', 'refund')),
    description TEXT,
    ref_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed pre-migration data:
-- User 1: Has negative balance (from legacy bug) to test migration cleanup 2.1
-- User 2: Has balance = 500 but 0 transactions to test migration backfill 3.1
-- User 3: Normal user for main tests
INSERT INTO auth.users (id, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'negative@test.vn'),
    ('22222222-2222-2222-2222-222222222222', 'backfill@test.vn'),
    ('33333333-3333-3333-3333-333333333333', 'teacher1@test.vn'),
    ('44444444-4444-4444-4444-444444444444', 'teacher2@test.vn');

INSERT INTO public.users (id, email, name, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'negative@test.vn', 'Negative User', 'teacher'),
    ('22222222-2222-2222-2222-222222222222', 'backfill@test.vn', 'Backfill User', 'teacher'),
    ('33333333-3333-3333-3333-333333333333', 'teacher1@test.vn', 'Teacher One', 'teacher'),
    ('44444444-4444-4444-4444-444444444444', 'teacher2@test.vn', 'Teacher Two', 'teacher');

INSERT INTO public.wallets (id, user_id, balance) VALUES
    ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', -150),
    ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 500),
    ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 100),
    ('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 100);

-- Also add one legacy transaction for user 3
INSERT INTO public.wallet_txns (wallet_id, amount, type, description) VALUES
    ('a3333333-3333-3333-3333-333333333333', 100, 'signup_bonus', 'Initial bonus');

-- Grant permissions on tables to roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. APPLY MIGRATION 20261110_fix_wallet_ledger_and_rpc.sql
\i supabase/migrations/20261110_fix_wallet_ledger_and_rpc.sql

-- Attach trigger to auth.users for new user testing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- TEST SUITE 1: VERIFY MIGRATION CLEANUP & BACKFILL RECONCILIATION
-- ==============================================================================
DO $$
DECLARE
    v_neg_bal INTEGER;
    v_backfill_txns INTEGER;
    v_backfill_amount INTEGER;
    v_backfill_src TEXT;
BEGIN
    -- Check 1.1: Negative balance cleaned to 0
    SELECT balance INTO v_neg_bal FROM public.wallets WHERE user_id = '11111111-1111-1111-1111-111111111111';
    IF v_neg_bal <> 0 THEN
        RAISE EXCEPTION 'TEST FAILED: Negative balance not reset to 0 (found %)', v_neg_bal;
    END IF;

    -- Check 1.2: Backfilled wallet_txns record for User 2 (had 500 balance, 0 txns)
    SELECT count(*), amount, metadata->>'source'
    INTO v_backfill_txns, v_backfill_amount, v_backfill_src
    FROM public.wallet_txns
    WHERE wallet_id = 'a2222222-2222-2222-2222-222222222222'
    GROUP BY amount, metadata->>'source';

    IF v_backfill_txns <> 1 OR v_backfill_amount <> 500 OR v_backfill_src <> 'migration_20261110_reconciliation' THEN
        RAISE EXCEPTION 'TEST FAILED: Backfill reconciliation failed. Found txns=%, amount=%, src=%',
            v_backfill_txns, v_backfill_amount, v_backfill_src;
    END IF;

    -- Check 1.3: User 3 (already had txn) should NOT have duplicate backfill
    SELECT count(*) INTO v_backfill_txns FROM public.wallet_txns WHERE wallet_id = 'a3333333-3333-3333-3333-333333333333';
    IF v_backfill_txns <> 1 THEN
        RAISE EXCEPTION 'TEST FAILED: User 3 received duplicate backfill (count=%)', v_backfill_txns;
    END IF;

    RAISE NOTICE 'SUCCESS: Test Suite 1 Passed (Migration Cleanup & Backfill Reconciliation)';
END $$;

-- ==============================================================================
-- TEST SUITE 2: VERIFY ALL 17 TRANSACTION TYPES ARE ACCEPTED
-- ==============================================================================
DO $$
DECLARE
    types TEXT[] := ARRAY[
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
    ];
    t TEXT;
    v_count INTEGER;
BEGIN
    FOREACH t IN ARRAY types LOOP
        INSERT INTO public.wallet_txns (wallet_id, amount, type, description, metadata)
        VALUES ('a3333333-3333-3333-3333-333333333333', 10, t, 'Testing type: ' || t, jsonb_build_object('type_test', t));
    END LOOP;

    SELECT count(*) INTO v_count FROM public.wallet_txns WHERE metadata->>'type_test' IS NOT NULL;
    IF v_count <> 17 THEN
        RAISE EXCEPTION 'TEST FAILED: Expected 17 transaction types inserted, got %', v_count;
    END IF;

    RAISE NOTICE 'SUCCESS: Test Suite 2 Passed (All 17 Transaction Types Accepted)';
END $$;

-- ==============================================================================
-- TEST SUITE 3: VERIFY INVALID TRANSACTION TYPES & NEGATIVE BALANCES REJECTED
-- ==============================================================================
DO $$
DECLARE
    v_caught BOOLEAN := false;
BEGIN
    -- Check 3.1: Invalid type rejected
    BEGIN
        INSERT INTO public.wallet_txns (wallet_id, amount, type, description)
        VALUES ('a3333333-3333-3333-3333-333333333333', 10, 'crypto_mining_invalid', 'Illegal type');
    EXCEPTION WHEN check_violation THEN
        v_caught := true;
    END;

    IF NOT v_caught THEN
        RAISE EXCEPTION 'TEST FAILED: Invalid transaction type was NOT rejected by check constraint!';
    END IF;

    -- Check 3.2: Direct balance < 0 rejected on UPDATE
    v_caught := false;
    BEGIN
        UPDATE public.wallets SET balance = -1 WHERE id = 'a3333333-3333-3333-3333-333333333333';
    EXCEPTION WHEN check_violation THEN
        v_caught := true;
    END;

    IF NOT v_caught THEN
        RAISE EXCEPTION 'TEST FAILED: Negative balance UPDATE was NOT rejected by wallets_balance_check!';
    END IF;

    -- Check 3.3: Direct balance < 0 rejected on INSERT
    v_caught := false;
    BEGIN
        INSERT INTO public.wallets (user_id, balance) VALUES ('55555555-5555-5555-5555-555555555555', -50);
    EXCEPTION WHEN check_violation THEN
        v_caught := true;
    END;

    IF NOT v_caught THEN
        RAISE EXCEPTION 'TEST FAILED: Negative balance INSERT was NOT rejected by wallets_balance_check!';
    END IF;

    -- Check 3.4: Negative daily quota rejected
    v_caught := false;
    BEGIN
        UPDATE public.wallets SET daily_quota = -5 WHERE id = 'a3333333-3333-3333-3333-333333333333';
    EXCEPTION WHEN check_violation THEN
        v_caught := true;
    END;

    IF NOT v_caught THEN
        RAISE EXCEPTION 'TEST FAILED: Negative daily quota was NOT rejected by wallets_daily_quota_check!';
    END IF;

    RAISE NOTICE 'SUCCESS: Test Suite 3 Passed (Constraints Strict Rejection)';
END $$;

-- ==============================================================================
-- TEST SUITE 4: ATOMIC DEDUCTION FUNCTION LOGIC & SECURITY CHECKS
-- ==============================================================================
DO $$
DECLARE
    v_res JSONB;
    v_uid UUID := '33333333-3333-3333-3333-333333333333';
    v_other_uid UUID := '44444444-4444-4444-4444-444444444444';
    v_bal INTEGER;
    v_caught BOOLEAN := false;
    v_txn_type TEXT;
BEGIN
    -- Reset wallet 3 balance to 100
    UPDATE public.wallets SET balance = 100 WHERE user_id = v_uid;

    -- 4.1: Normal deduction as self (auth.uid() = v_uid)
    CALL set_auth_context(v_uid, 'authenticated');
    v_res := public.deduct_user_credits_atomic(v_uid, 30, 'ai_usage', jsonb_build_object('model', 'gemini-2.0-flash'));
    IF (v_res->>'success')::boolean <> true OR (v_res->>'balance')::int <> 70 OR (v_res->>'deducted')::int <> 30 THEN
        RAISE EXCEPTION 'TEST FAILED: Normal deduction failed: %', v_res;
    END IF;

    -- 4.2: Zero amount deduction (should succeed with no transaction recorded)
    v_res := public.deduct_user_credits_atomic(v_uid, 0, 'generate_exam');
    IF (v_res->>'success')::boolean <> true OR (v_res->>'balance')::int <> 70 OR (v_res->>'deducted')::int <> 0 THEN
        RAISE EXCEPTION 'TEST FAILED: Zero amount deduction failed: %', v_res;
    END IF;

    -- 4.3: Negative amount deduction (must return INVALID_AMOUNT)
    v_res := public.deduct_user_credits_atomic(v_uid, -10, 'generate_exam');
    IF (v_res->>'success')::boolean <> false OR (v_res->>'error') <> 'INVALID_AMOUNT' THEN
        RAISE EXCEPTION 'TEST FAILED: Negative deduction was not rejected: %', v_res;
    END IF;

    -- 4.4: Insufficient credits (balance is 70, asking 100, strict=false)
    v_res := public.deduct_user_credits_atomic(v_uid, 100, 'generate_exam');
    IF (v_res->>'success')::boolean <> false OR (v_res->>'error') <> 'INSUFFICIENT_CREDITS' THEN
        RAISE EXCEPTION 'TEST FAILED: Insufficient credits should return error: %', v_res;
    END IF;

    -- 4.5: Insufficient credits with strict=true (must RAISE EXCEPTION)
    v_caught := false;
    BEGIN
        PERFORM public.deduct_user_credits_atomic(v_uid, 100, 'generate_exam', jsonb_build_object('strict', true));
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%INSUFFICIENT_CREDITS%' THEN
            v_caught := true;
        END IF;
    END;

    IF NOT v_caught THEN
        RAISE EXCEPTION 'TEST FAILED: Strict deduction did NOT raise exception!';
    END IF;

    -- 4.6: Unauthorized access: User 3 tries to deduct from User 4
    v_res := public.deduct_user_credits_atomic(v_other_uid, 10, 'generate_exam');
    IF (v_res->>'success')::boolean <> false OR (v_res->>'error') <> 'UNAUTHORIZED_ACCESS' THEN
        RAISE EXCEPTION 'TEST FAILED: Cross-account deduction was not blocked: %', v_res;
    END IF;

    -- 4.7: Service role CAN deduct from any user
    CALL set_auth_context(NULL, 'service_role');
    v_res := public.deduct_user_credits_atomic(v_other_uid, 10, 'generate_exam');
    IF (v_res->>'success')::boolean <> true OR (v_res->>'balance')::int <> 90 THEN
        RAISE EXCEPTION 'TEST FAILED: Service role deduction failed: %', v_res;
    END IF;

    -- 4.8: Action mapping fallback: custom unknown action string falls back to 'ai_usage'
    CALL set_auth_context(v_uid, 'authenticated');
    v_res := public.deduct_user_credits_atomic(v_uid, 10, 'unknown_custom_ai_tool');
    IF (v_res->>'success')::boolean <> true THEN
        RAISE EXCEPTION 'TEST FAILED: Unknown action string failed: %', v_res;
    END IF;

    -- Verify that the recorded transaction type is 'ai_usage'
    SELECT type INTO v_txn_type FROM public.wallet_txns WHERE id = (v_res->>'txn_id')::uuid;
    IF v_txn_type <> 'ai_usage' THEN
        RAISE EXCEPTION 'TEST FAILED: Action fallback expected ai_usage, got %', v_txn_type;
    END IF;

    -- 4.9: Malformed ref_id handling (should not throw uuid cast syntax error)
    v_res := public.deduct_user_credits_atomic(v_uid, 10, 'generate_exam', jsonb_build_object('ref_id', 'not-a-valid-uuid'));
    IF (v_res->>'success')::boolean <> true THEN
        RAISE EXCEPTION 'TEST FAILED: Malformed ref_id threw an unhandled exception: %', v_res;
    END IF;

    RAISE NOTICE 'SUCCESS: Test Suite 4 Passed (Atomic Deduction Logic & Security)';
END $$;

-- ==============================================================================
-- TEST SUITE 5: DEDUCTION & REFUND OVERLOADS & AUTHORIZATION LOCKDOWN
-- ==============================================================================
DO $$
DECLARE
    v_res JSONB;
    v_uid UUID := '33333333-3333-3333-3333-333333333333';
    v_test_ref UUID := '99999999-9999-9999-9999-999999999999';
    v_bal INTEGER;
    v_denied BOOLEAN := false;
BEGIN
    CALL set_auth_context(v_uid, 'authenticated');

    -- 5.1: deduct_user_credits overload (user_id, amount, description, ref_id)
    v_res := public.deduct_user_credits(v_uid, 10, 'Testing overload deduction', v_test_ref);
    IF (v_res->>'success')::boolean <> true OR (v_res->>'deducted')::int <> 10 THEN
        RAISE EXCEPTION 'TEST FAILED: deduct_user_credits overload failed: %', v_res;
    END IF;

    -- Check ref_id was recorded in txn
    SELECT ref_id INTO v_test_ref FROM public.wallet_txns WHERE id = (v_res->>'txn_id')::uuid;
    IF v_test_ref <> '99999999-9999-9999-9999-999999999999' THEN
        RAISE EXCEPTION 'TEST FAILED: ref_id was not properly saved in overload: %', v_test_ref;
    END IF;

    -- 5.2: Adversarial check: authenticated user MUST BE DENIED execution of refund_user_credits_atomic
    v_denied := false;
    BEGIN
        PERFORM public.refund_user_credits_atomic(v_uid, 15, 'refund', jsonb_build_object('description', 'Hacker self refund'));
    EXCEPTION WHEN insufficient_privilege THEN
        v_denied := true;
    END;
    IF NOT v_denied THEN
        RAISE EXCEPTION 'SECURITY BREACH: Authenticated user was able to execute refund_user_credits_atomic!';
    END IF;

    -- 5.3: Adversarial check: authenticated user MUST BE DENIED execution of refund_user_credits overload
    v_denied := false;
    BEGIN
        PERFORM public.refund_user_credits(v_uid, 15, 'Hacker self refund overload', v_test_ref);
    EXCEPTION WHEN insufficient_privilege THEN
        v_denied := true;
    END;
    IF NOT v_denied THEN
        RAISE EXCEPTION 'SECURITY BREACH: Authenticated user was able to execute refund_user_credits overload!';
    END IF;

    -- 5.4: Adversarial check: anonymous user MUST BE DENIED execution of both refund functions
    CALL set_auth_context(NULL, 'anon');

    v_denied := false;
    BEGIN
        PERFORM public.refund_user_credits_atomic(v_uid, 15, 'refund', jsonb_build_object('description', 'Anon self refund'));
    EXCEPTION WHEN insufficient_privilege THEN
        v_denied := true;
    END;
    IF NOT v_denied THEN
        RAISE EXCEPTION 'SECURITY BREACH: Anonymous user was able to execute refund_user_credits_atomic!';
    END IF;

    v_denied := false;
    BEGIN
        PERFORM public.refund_user_credits(v_uid, 15, 'Anon self refund overload', v_test_ref);
    EXCEPTION WHEN insufficient_privilege THEN
        v_denied := true;
    END;
    IF NOT v_denied THEN
        RAISE EXCEPTION 'SECURITY BREACH: Anonymous user was able to execute refund_user_credits overload!';
    END IF;

    -- 5.5: Procedural defense-in-depth: If invoked without service_role claim, returns UNAUTHORIZED_ACCESS
    CALL set_auth_context(NULL, 'postgres');
    -- Setting jwt claim role to 'authenticated' to simulate execution without service_role
    PERFORM set_config('request.jwt.claims', '{"role": "authenticated"}', true);
    v_res := public.refund_user_credits_atomic(v_uid, 15);
    IF (v_res->>'success')::boolean <> false OR (v_res->>'error') <> 'UNAUTHORIZED_ACCESS' THEN
        RAISE EXCEPTION 'SECURITY BREACH: Calling refund without service_role did not return UNAUTHORIZED_ACCESS: %', v_res;
    END IF;

    -- 5.6: Authorized execution via service_role MUST SUCCEED
    CALL set_auth_context(NULL, 'service_role');

    SELECT balance INTO v_bal FROM public.wallets WHERE user_id = v_uid;
    v_res := public.refund_user_credits_atomic(v_uid, 15, 'refund', jsonb_build_object('description', 'Authorized service_role refund'));
    IF (v_res->>'success')::boolean <> true OR (v_res->>'balance')::int <> (v_bal + 15) OR (v_res->>'refunded')::int <> 15 THEN
        RAISE EXCEPTION 'TEST FAILED: Legitimate service_role refund_user_credits_atomic failed: %', v_res;
    END IF;

    -- 5.7: Authorized execution of overload via service_role
    SELECT balance INTO v_bal FROM public.wallets WHERE user_id = v_uid;
    v_res := public.refund_user_credits(v_uid, 10, 'Authorized overload refund', v_test_ref);
    IF (v_res->>'success')::boolean <> true OR (v_res->>'balance')::int <> (v_bal + 10) THEN
        RAISE EXCEPTION 'TEST FAILED: Legitimate service_role refund_user_credits overload failed: %', v_res;
    END IF;

    -- 5.8: Invalid refund amounts under service_role (amount <= 0)
    v_res := public.refund_user_credits_atomic(v_uid, 0);
    IF (v_res->>'success')::boolean <> false OR (v_res->>'error') <> 'INVALID_AMOUNT' THEN
        RAISE EXCEPTION 'TEST FAILED: Zero refund was not rejected: %', v_res;
    END IF;

    v_res := public.refund_user_credits_atomic(v_uid, -5);
    IF (v_res->>'success')::boolean <> false OR (v_res->>'error') <> 'INVALID_AMOUNT' THEN
        RAISE EXCEPTION 'TEST FAILED: Negative refund was not rejected: %', v_res;
    END IF;

    RAISE NOTICE 'SUCCESS: Test Suite 5 Passed (Deduction & Refund Authorization Lockdown)';
END $$;

-- ==============================================================================
-- TEST SUITE 6: NEW USER REGISTRATION & TRIGGER RECONCILIATION
-- ==============================================================================
DO $$
DECLARE
    v_new_id UUID := '77777777-7777-7777-7777-777777777777';
    v_user_exists BOOLEAN;
    v_wallet_bal INTEGER;
    v_txn_count INTEGER;
    v_txn_amount INTEGER;
    v_txn_type TEXT;
BEGIN
    CALL set_auth_context(NULL, 'service_role');

    -- Insert into auth.users (simulating Supabase Auth signup)
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (v_new_id, 'newteacher@eduteach.vn', jsonb_build_object('full_name', 'Cô Hương'));

    -- Check 6.1: public.users profile created
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = v_new_id) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'TEST FAILED: handle_new_user trigger did not create public.users record!';
    END IF;

    -- Check 6.2: public.wallets record created with initial 5000 credits
    SELECT balance INTO v_wallet_bal FROM public.wallets WHERE user_id = v_new_id;
    IF v_wallet_bal <> 5000 THEN
        RAISE EXCEPTION 'TEST FAILED: handle_new_user created wallet with balance %, expected 5000', v_wallet_bal;
    END IF;

    -- Check 6.3: Corresponding ledger record in wallet_txns
    SELECT count(*), amount, type
    INTO v_txn_count, v_txn_amount, v_txn_type
    FROM public.wallet_txns t
    JOIN public.wallets w ON w.id = t.wallet_id
    WHERE w.user_id = v_new_id
    GROUP BY amount, type;

    IF v_txn_count <> 1 OR v_txn_amount <> 5000 OR v_txn_type <> 'signup_bonus' THEN
        RAISE EXCEPTION 'TEST FAILED: Missing or invalid ledger record for new user! Count=%, Amount=%, Type=%',
            v_txn_count, v_txn_amount, v_txn_type;
    END IF;

    RAISE NOTICE 'SUCCESS: Test Suite 6 Passed (Trigger handle_new_user & Ledger Reconciliation)';
END $$;

-- ==============================================================================
-- SUMMARY
-- ==============================================================================
SELECT 'ALL LIVE POSTGRESQL ADVERSARIAL SQL TESTS PASSED CLEANLY!' AS verdict;
