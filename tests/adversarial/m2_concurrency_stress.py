# tests/adversarial/m2_concurrency_stress.py
# Real PostgreSQL 18 Multi-Threaded Concurrency & FOR UPDATE Row Lock Stress Harness
# Written by Teamwork Challenger (Empirical Challenger)

import subprocess
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

PSQL_PATH = r"C:\Program Files\PostgreSQL\18\bin\psql.exe"
HOST = "127.0.0.1"
PORT = "54399"
USER = "postgres"
DB = "postgres"
TARGET_USER = "33333333-3333-3333-3333-333333333333"

def run_query(sql):
    cmd = [PSQL_PATH, "-h", HOST, "-p", PORT, "-U", USER, "-d", DB, "-t", "-A", "-c", sql]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return res.stdout.strip()

def deduct_credits(amount=10):
    sql = f"""
    CALL set_auth_context(NULL, 'service_role');
    SELECT public.deduct_user_credits_atomic('{TARGET_USER}', {amount});
    """
    cmd = [PSQL_PATH, "-h", HOST, "-p", PORT, "-U", USER, "-d", DB, "-t", "-A", "-c", sql]
    res = subprocess.run(cmd, capture_output=True, text=True)
    lines = [line.strip() for line in res.stdout.splitlines() if line.strip().startswith("{")]
    if lines:
        try:
            return json.loads(lines[-1])
        except Exception as e:
            return {"error": f"JSON parse error: {e}", "raw": res.stdout}
    return {"error": "No JSON returned", "raw": res.stdout, "stderr": res.stderr}

def main():
    print("================================================================================")
    print("STARTING EMPIRICAL CONCURRENCY & ROW LOCK STRESS TEST (POSTGRESQL 18)")
    print("================================================================================\n")

    # 1. Reset user wallet balance to exactly 100 and clean up existing transactions for this user
    print("[1] Initializing wallet balance to 100 credits...")
    run_query(f"UPDATE public.wallets SET balance = 100 WHERE user_id = '{TARGET_USER}';")
    run_query(f"DELETE FROM public.wallet_txns WHERE wallet_id = (SELECT id FROM public.wallets WHERE user_id = '{TARGET_USER}');")
    
    initial_bal = int(run_query(f"SELECT balance FROM public.wallets WHERE user_id = '{TARGET_USER}';"))
    print(f"    Initial wallet balance confirmed: {initial_bal} credits.")
    assert initial_bal == 100, f"Expected initial balance 100, got {initial_bal}"

    # 2. Launch 20 simultaneous deduction requests of 10 credits each
    # Total attempted deduction: 200 credits
    # Available: 100 credits
    # Due to FOR UPDATE row lock, exactly 10 must succeed and exactly 10 must fail with INSUFFICIENT_CREDITS
    num_threads = 20
    deduct_amount = 10
    print(f"\n[2] Launching {num_threads} concurrent threads attempting to deduct {deduct_amount} credits each...")
    print(f"    Total requested deductions: {num_threads * deduct_amount} credits against {initial_bal} credits available.")
    
    start_time = time.perf_counter()
    results = []
    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = [executor.submit(deduct_credits, deduct_amount) for _ in range(num_threads)]
        for f in as_completed(futures):
            results.append(f.result())
    elapsed = time.perf_counter() - start_time
    print(f"    All {num_threads} concurrent transactions completed in {elapsed:.3f} seconds.")

    # 3. Analyze results
    success_count = sum(1 for r in results if r.get("success") is True)
    insufficient_count = sum(1 for r in results if r.get("success") is False and r.get("error") == "INSUFFICIENT_CREDITS")
    other_errors = [r for r in results if r.get("success") is not True and r.get("error") != "INSUFFICIENT_CREDITS"]

    print(f"\n[3] Concurrency Results:")
    print(f"    - Successful deductions: {success_count} / {num_threads}")
    print(f"    - Rejected (INSUFFICIENT_CREDITS): {insufficient_count} / {num_threads}")
    print(f"    - Unexpected errors: {len(other_errors)}")

    if other_errors:
        print(f"    Errors detail: {other_errors}")

    # 4. Verify Database Invariants
    final_bal = int(run_query(f"SELECT balance FROM public.wallets WHERE user_id = '{TARGET_USER}';"))
    txn_count = int(run_query(f"SELECT count(*) FROM public.wallet_txns WHERE wallet_id = (SELECT id FROM public.wallets WHERE user_id = '{TARGET_USER}');"))
    sum_deducted = int(run_query(f"SELECT COALESCE(sum(amount), 0) FROM public.wallet_txns WHERE wallet_id = (SELECT id FROM public.wallets WHERE user_id = '{TARGET_USER}');"))

    print(f"\n[4] Database State Verification:")
    print(f"    - Final Wallet Balance: {final_bal} credits (Expected: 0)")
    print(f"    - Total Transactions in Ledger: {txn_count} (Expected: 10)")
    print(f"    - Net Ledger Debit: {sum_deducted} credits (Expected: -100)")

    # Assertions
    assert success_count == 10, f"Expected exactly 10 successful deductions, got {success_count}"
    assert insufficient_count == 10, f"Expected exactly 10 rejections, got {insufficient_count}"
    assert len(other_errors) == 0, f"Unexpected errors detected: {other_errors}"
    assert final_bal == 0, f"Balance must be exactly 0, got {final_bal}"
    assert txn_count == 10, f"Expected 10 ledger rows, got {txn_count}"
    assert sum_deducted == -100, f"Expected -100 total sum in ledger, got {sum_deducted}"

    print("\n================================================================================")
    print("CONCURRENCY & ROW LOCK STRESS TEST PASSED PERFECTLY!")
    print("ZERO RACE CONDITIONS, ZERO DOUBLE SPENDING, NON-NEGATIVE INVARIANT PRESERVED!")
    print("================================================================================")

if __name__ == "__main__":
    main()
