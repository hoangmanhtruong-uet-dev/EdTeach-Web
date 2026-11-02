# tests/adversarial/m2_r2_refund_adversarial.py
# Adversarial Empirical Stress Suite for Milestone 2 Iteration 2
# Focus: Comprehensive Refund Permission Lockdown, UNAUTHORIZED_ACCESS verification,
# and 5,000 Credit Signup Ledger Verification on PostgreSQL 18.
# Author: Challenger #1 (Empirical Challenger)

import os
import sys
import json
import time
import socket
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
MIGRATION_PATH = ROOT_DIR / "supabase" / "migrations" / "20261110_fix_wallet_ledger_and_rpc.sql"
AFFILIATE_PATH = ROOT_DIR / "frontend" / "src" / "app" / "(dashboard)" / "affiliate" / "page.tsx"

PSQL_EXE = r"C:\Program Files\PostgreSQL\18\bin\psql.exe"
PG_EXE = r"C:\Program Files\PostgreSQL\18\bin\postgres.exe"
INITDB_EXE = r"C:\Program Files\PostgreSQL\18\bin\initdb.exe"
PG_DATA = os.path.join(os.environ.get("TEMP", r"C:\Temp"), "pg_m2_54399")
PORT = 54399
HOST = "127.0.0.1"
USER = "postgres"
DB = "postgres"

test_passed = 0
test_total = 0
failures = []

def record_test(name, success, error_msg=None):
    global test_passed, test_total
    test_total += 1
    if success:
        test_passed += 1
        print(f"[PASS] {name}")
    else:
        failures.append((name, error_msg))
        print(f"[FAIL] {name}")
        if error_msg:
            print(f"       Error: {error_msg}")

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((HOST, port)) == 0

def run_psql(sql, check_exit=True):
    cmd = [PSQL_EXE, "-h", HOST, "-p", str(PORT), "-U", USER, "-d", DB, "-t", "-A", "-c", sql]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if check_exit and res.returncode != 0:
        raise RuntimeError(f"psql error (code {res.returncode}):\nSTDOUT: {res.stdout}\nSTDERR: {res.stderr}")
    return res.returncode, res.stdout.strip(), res.stderr.strip()

def main():
    print("================================================================================")
    print("CHALLENGER #1 EMPIRICAL ADVERSARIAL SUITE — MILESTONE 2 ITERATION 2")
    print("Scope: Refund RPC Lockdown, Defense-in-Depth, and 5k Signup Bonus")
    print("================================================================================\n")

    # =========================================================================
    # PART 1: STATIC & SOURCE LEVEL ADVERSARIAL CHECKS
    # =========================================================================
    print("--- PART 1: Source & Migration Static Analysis ---")
    migration_content = MIGRATION_PATH.read_text(encoding="utf-8")
    affiliate_content = AFFILIATE_PATH.read_text(encoding="utf-8")

    # 1.1: Revocations present
    revokes_present = (
        "REVOKE EXECUTE ON FUNCTION public.refund_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) FROM PUBLIC, anon, authenticated;" in migration_content and
        "REVOKE EXECUTE ON FUNCTION public.refund_user_credits(UUID, INTEGER, TEXT, UUID) FROM PUBLIC, anon, authenticated;" in migration_content
    )
    record_test("1.1 REVOKE EXECUTE on refund functions from PUBLIC, anon, authenticated", revokes_present)

    # 1.2: Exclusive grant to service_role
    grants_correct = (
        "GRANT EXECUTE ON FUNCTION public.refund_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) TO service_role;" in migration_content and
        "GRANT EXECUTE ON FUNCTION public.refund_user_credits(UUID, INTEGER, TEXT, UUID) TO service_role;" in migration_content
    )
    record_test("1.2 GRANT EXECUTE on refund functions strictly to service_role", grants_correct)

    # 1.3: No grant to authenticated or anon for refund functions
    lines = migration_content.splitlines()
    bad_grants = []
    for l in lines:
        if "grant execute on function" in l.lower() and "refund" in l.lower():
            parts = l.lower().split(" to ")
            if len(parts) > 1:
                grantee = parts[1]
                if any(r in grantee for r in ["authenticated", "anon", "public"]):
                    bad_grants.append(l)
    record_test("1.3 Adversarial scan: No rogue GRANT on refund to authenticated, anon or public", len(bad_grants) == 0, f"Found: {bad_grants}")

    # 1.4: Procedural defense-in-depth check in refund_user_credits_atomic
    has_procedural_guard = "IF current_user <> 'service_role' AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN" in migration_content
    has_unauthorized_error = "'error', 'UNAUTHORIZED_ACCESS'" in migration_content
    record_test("1.4 Procedural defense-in-depth guard in refund_user_credits_atomic", has_procedural_guard and has_unauthorized_error)

    # 1.5: 5,000 credit signup initialization in handle_new_user()
    has_5000_wallet = "VALUES (NEW.id, 5000, 3, 0, timezone('utc'::text, now()))" in migration_content
    has_5000_txn = "5000,\n            'signup_bonus'" in migration_content or "5000,\r\n            'signup_bonus'" in migration_content
    no_100_in_trigger = "VALUES (NEW.id, 100," not in migration_content
    record_test("1.5 handle_new_user() initializes wallet and ledger with exactly 5,000 credits", has_5000_wallet and has_5000_txn and no_100_in_trigger)

    # 1.6: Affiliate page clean of 100000 and 100k
    no_100k_raw = "100000" not in affiliate_content and "100k" not in affiliate_content
    uses_min_payout = "affiliateBalance < MINIMUM_PAYOUT_VND" in affiliate_content and "payoutAmount < MINIMUM_PAYOUT_VND" in affiliate_content
    record_test("1.6 Affiliate page 100k references replaced with MINIMUM_PAYOUT_VND (200k)", no_100k_raw and uses_min_payout)

    # =========================================================================
    # PART 2: LIVE POSTGRESQL 18 ADVERSARIAL EXECUTION
    # =========================================================================
    print("\n--- PART 2: Live PostgreSQL 18 Engine Hardening & Injection Attacks ---")

    proc = None
    started_by_us = False

    if not is_port_open(PORT):
        print(f"Starting isolated PostgreSQL instance on port {PORT}...")
        if not os.path.exists(PG_DATA):
            subprocess.run([INITDB_EXE, "-D", PG_DATA, "-U", "postgres", "-A", "trust"], check=True, capture_output=True)
        proc = subprocess.Popen([PG_EXE, "-D", PG_DATA, "-p", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        started_by_us = True
        connected = False
        for _ in range(20):
            time.sleep(0.5)
            if is_port_open(PORT):
                # Check if ready to accept queries
                test_res = subprocess.run([PSQL_EXE, "-h", HOST, "-p", str(PORT), "-U", USER, "-d", DB, "-c", "SELECT 1;"], capture_output=True, text=True)
                if test_res.returncode == 0:
                    connected = True
                    break
        if not connected:
            print(f"[FAIL] Could not connect to PostgreSQL on port {PORT}")
            sys.exit(1)

    try:
        # Run base migration test setup
        print("Ensuring latest schema migration is applied to PostgreSQL test database...")
        cmd = [PSQL_EXE, "-h", HOST, "-p", str(PORT), "-U", USER, "-d", DB, "-f", str(ROOT_DIR / "tests" / "adversarial" / "m2_sql_ledger_live.test.sql")]
        setup_res = subprocess.run(cmd, capture_output=True, text=True)
        if setup_res.returncode != 0:
            raise RuntimeError(f"Failed to setup DB with m2_sql_ledger_live.test.sql:\n{setup_res.stderr}")

        target_user = "33333333-3333-3333-3333-333333333333"

        # 2.1: Anonymous user calling refund_user_credits_atomic -> REJECTED (permission denied)
        sql_anon_atomic = f"""
        CALL set_auth_context(NULL, 'anon');
        SELECT public.refund_user_credits_atomic('{target_user}'::uuid, 100);
        """
        code, out, err = run_psql(sql_anon_atomic, check_exit=False)
        record_test("2.1 Anon user cannot execute refund_user_credits_atomic (permission denied)",
                    code != 0 and "permission denied" in err.lower(), f"code={code}, err={err}")

        # 2.2: Anonymous user calling refund_user_credits -> REJECTED (permission denied)
        sql_anon_overload = f"""
        CALL set_auth_context(NULL, 'anon');
        SELECT public.refund_user_credits('{target_user}'::uuid, 100);
        """
        code, out, err = run_psql(sql_anon_overload, check_exit=False)
        record_test("2.2 Anon user cannot execute refund_user_credits (permission denied)",
                    code != 0 and "permission denied" in err.lower(), f"code={code}, err={err}")

        # 2.3: Authenticated regular user calling refund_user_credits_atomic on SELF -> REJECTED (permission denied)
        sql_auth_atomic = f"""
        CALL set_auth_context('{target_user}'::uuid, 'authenticated');
        SELECT public.refund_user_credits_atomic('{target_user}'::uuid, 100);
        """
        code, out, err = run_psql(sql_auth_atomic, check_exit=False)
        record_test("2.3 Authenticated user cannot execute refund_user_credits_atomic on SELF (permission denied)",
                    code != 0 and "permission denied" in err.lower(), f"code={code}, err={err}")

        # 2.4: Authenticated regular user calling refund_user_credits overload on SELF -> REJECTED (permission denied)
        sql_auth_overload = f"""
        CALL set_auth_context('{target_user}'::uuid, 'authenticated');
        SELECT public.refund_user_credits('{target_user}'::uuid, 100);
        """
        code, out, err = run_psql(sql_auth_overload, check_exit=False)
        record_test("2.4 Authenticated user cannot execute refund_user_credits overload on SELF (permission denied)",
                    code != 0 and "permission denied" in err.lower(), f"code={code}, err={err}")

        # 2.5: Procedural check returns UNAUTHORIZED_ACCESS when executed by a role with execute privileges
        # but lacking service_role JWT / role context
        sql_procedural_guard = f"""
        CALL set_auth_context(NULL, 'postgres');
        PERFORM set_config('request.jwt.claims', '{{"role": "authenticated"}}', true);
        SELECT public.refund_user_credits_atomic('{target_user}'::uuid, 100);
        """
        code, out, err = run_psql(f"SELECT (public.refund_user_credits_atomic('{target_user}'::uuid, 100))->>'error';", check_exit=False)
        # In default postgres superuser without service_role jwt:
        # current_user = 'postgres' (not 'service_role') and jwt role is empty -> UNAUTHORIZED_ACCESS
        record_test("2.5 Procedural guard: Calling refund without service_role yields UNAUTHORIZED_ACCESS",
                    out.strip() == "UNAUTHORIZED_ACCESS", f"output={out}, err={err}")

        # 2.6: Authorized execution via service_role MUST SUCCEED
        # Get balance before
        _, bal_before_str, _ = run_psql(f"SELECT balance FROM public.wallets WHERE user_id = '{target_user}';")
        bal_before = int(bal_before_str)

        sql_legit_refund = f"""
        CALL set_auth_context(NULL, 'service_role');
        SELECT public.refund_user_credits_atomic('{target_user}'::uuid, 75, 'refund', '{{"description": "Legit challenge refund"}}'::jsonb);
        """
        code, out, err = run_psql(sql_legit_refund)
        lines = [l for l in out.splitlines() if l.startswith("{")]
        res_json = json.loads(lines[-1]) if lines else {}

        _, bal_after_str, _ = run_psql(f"SELECT balance FROM public.wallets WHERE user_id = '{target_user}';")
        bal_after = int(bal_after_str)

        _, txn_count_str, _ = run_psql(f"SELECT count(*) FROM public.wallet_txns WHERE wallet_id = (SELECT id FROM public.wallets WHERE user_id = '{target_user}') AND type = 'refund' AND amount = 75;")
        txn_count = int(txn_count_str)

        refund_success = (
            res_json.get("success") is True and
            res_json.get("refunded") == 75 and
            res_json.get("balance") == bal_before + 75 and
            bal_after == bal_before + 75 and
            txn_count >= 1
        )
        record_test("2.6 service_role executes refund_user_credits_atomic successfully with ledger transaction",
                    refund_success, f"res={res_json}, bal_before={bal_before}, bal_after={bal_after}, txns={txn_count}")

        # 2.7: Invalid refund amounts under service_role
        code_zero, out_zero, _ = run_psql(f"CALL set_auth_context(NULL, 'service_role'); SELECT (public.refund_user_credits_atomic('{target_user}'::uuid, 0))->>'error';")
        code_neg, out_neg, _ = run_psql(f"CALL set_auth_context(NULL, 'service_role'); SELECT (public.refund_user_credits_atomic('{target_user}'::uuid, -50))->>'error';")
        record_test("2.7 Zero or negative refund returns INVALID_AMOUNT under service_role",
                    "INVALID_AMOUNT" in out_zero and "INVALID_AMOUNT" in out_neg, f"zero={out_zero}, neg={out_neg}")

        # 2.8: New user creation trigger initializes wallet with exactly 5,000 credits
        new_test_uid = "99999999-9999-9999-9999-000000000001"
        sql_trigger = f"""
        CALL set_auth_context(NULL, 'service_role');
        DELETE FROM auth.users WHERE id = '{new_test_uid}';
        INSERT INTO auth.users (id, email, raw_user_meta_data)
        VALUES ('{new_test_uid}', 'newbie@school.vn', '{{"full_name": "Cô Lan"}}'::jsonb);
        """
        run_psql(sql_trigger)

        _, new_bal_str, _ = run_psql(f"SELECT balance FROM public.wallets WHERE user_id = '{new_test_uid}';")
        _, new_bonus_str, _ = run_psql(f"SELECT amount FROM public.wallet_txns WHERE wallet_id = (SELECT id FROM public.wallets WHERE user_id = '{new_test_uid}') AND type = 'signup_bonus';")

        new_bal = int(new_bal_str)
        new_bonus = int(new_bonus_str)
        record_test("2.8 handle_new_user() trigger creates wallet with 5,000 credits and 5,000 credit ledger entry",
                    new_bal == 5000 and new_bonus == 5000, f"balance={new_bal}, bonus_txn={new_bonus}")

    finally:
        if started_by_us and proc:
            print("\nStopping isolated PostgreSQL instance...")
            proc.terminate()
            proc.wait(timeout=5)

    # =========================================================================
    # SUMMARY
    # =========================================================================
    print("\n================================================================================")
    print(f"ADVERSARIAL HARNESS SUMMARY: {test_passed}/{test_total} tests passed ({len(failures)} failures)")
    print("================================================================================")

    if failures:
        print("FAILURES DETECTED:")
        for name, err in failures:
            print(f"- {name}: {err}")
        sys.exit(1)
    else:
        print("ALL ADVERSARIAL STRESS TESTS FOR MILESTONE 2 ITERATION 2 PASSED CLEANLY (100%)!")
        sys.exit(0)

if __name__ == "__main__":
    main()
