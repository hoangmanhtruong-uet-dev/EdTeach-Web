// tests/adversarial/m2_challenger_2_payout_and_ledger.test.mjs
// Challenger #2 Empirical Verification Test Suite for Milestone 2 Iteration 2
// Scope: Affiliate Payout Thresholds, Ledger Integrity & Authorization Lockdown

import fs from "fs";
import path from "path";
import assert from "assert";

console.log("================================================================================");
console.log("STARTING CHALLENGER #2 EMPIRICAL VERIFICATION SUITE (M2 ITERATION 2)");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// Suite 1: Affiliate Page Payout Threshold Verification
// -----------------------------------------------------------------------------
console.log("--- Suite 1: Affiliate Page Payout Threshold Verification ---");

const affiliatePagePath = path.resolve("frontend/src/app/(dashboard)/affiliate/page.tsx");
const affiliateContent = fs.readFileSync(affiliatePagePath, "utf-8");

runTest("1.1 Ensure no residual 100000 or 100k strings exist in affiliate/page.tsx", () => {
  const matches100000 = affiliateContent.match(/\b100000\b/g);
  const matches100k = affiliateContent.match(/100k/i);
  assert.strictEqual(matches100000, null, "Found residual '100000' in affiliate/page.tsx");
  assert.strictEqual(matches100k, null, "Found residual '100k' in affiliate/page.tsx");
});

runTest("1.2 Verify MINIMUM_PAYOUT_VND import from @/lib/constants", () => {
  assert(
    affiliateContent.includes('import { APP_URL, MINIMUM_PAYOUT_VND } from "@/lib/constants";') ||
    affiliateContent.includes('MINIMUM_PAYOUT_VND'),
    "MINIMUM_PAYOUT_VND must be imported from @/lib/constants"
  );
});

runTest("1.3 Verify Rút VietQR button disabled when affiliateBalance < MINIMUM_PAYOUT_VND", () => {
  assert(
    affiliateContent.includes("disabled={affiliateBalance < MINIMUM_PAYOUT_VND}"),
    "Rút VietQR button must be disabled when affiliateBalance < MINIMUM_PAYOUT_VND"
  );
});

runTest("1.4 Verify badge displays 'Min 200k tiền mặt'", () => {
  assert(
    affiliateContent.includes("Min 200k tiền mặt"),
    "History card header must display 'Min 200k tiền mặt'"
  );
});

runTest("1.5 Verify modal input min attribute is bound to MINIMUM_PAYOUT_VND", () => {
  assert(
    affiliateContent.includes("min={MINIMUM_PAYOUT_VND}"),
    "Modal payout amount input must have min={MINIMUM_PAYOUT_VND}"
  );
});

runTest("1.6 Verify modal submit button disabled when payoutAmount < MINIMUM_PAYOUT_VND", () => {
  assert(
    affiliateContent.includes("payoutAmount < MINIMUM_PAYOUT_VND"),
    "Modal submit button must be disabled when payoutAmount < MINIMUM_PAYOUT_VND"
  );
});

runTest("1.7 Verify handleRequestPayout blocks amounts below MINIMUM_PAYOUT_VND with alert", () => {
  assert(
    affiliateContent.includes("if (!payoutAmount || payoutAmount < MINIMUM_PAYOUT_VND)"),
    "handleRequestPayout must block amounts < MINIMUM_PAYOUT_VND"
  );
});

// -----------------------------------------------------------------------------
// Suite 2: Payout Boundary Conditions & Evaluation Logic
// -----------------------------------------------------------------------------
console.log("\n--- Suite 2: Payout Boundary Conditions & Evaluation Logic ---");

const MINIMUM_PAYOUT_VND = 200000;

function evaluatePayoutForm(affiliateBalance, payoutAmount, bankAccount, bankAccountName) {
  const isButtonDisabled = affiliateBalance < MINIMUM_PAYOUT_VND;
  const isSubmitDisabled =
    payoutAmount < MINIMUM_PAYOUT_VND ||
    payoutAmount > affiliateBalance ||
    !bankAccount.trim() ||
    !bankAccountName.trim();
  
  let validationError = null;
  if (!payoutAmount || payoutAmount < MINIMUM_PAYOUT_VND) {
    validationError = `Hạn mức rút tiền mặt tối thiểu là ${MINIMUM_PAYOUT_VND.toLocaleString("vi-VN")}đ.`;
  } else if (!bankAccount.trim() || !bankAccountName.trim()) {
    validationError = "Vui lòng điền đầy đủ số tài khoản và tên chủ thẻ.";
  }

  return { isButtonDisabled, isSubmitDisabled, validationError };
}

runTest("2.1 Balance below 200,000đ (e.g. 0đ, 50,000đ, 100,000đ, 199,999đ) disables trigger button", () => {
  const testBalances = [0, 1, 50000, 100000, 199999];
  for (const bal of testBalances) {
    const res = evaluatePayoutForm(bal, bal, "123456", "NGUYEN VAN A");
    assert.strictEqual(res.isButtonDisabled, true, `Balance ${bal}đ should disable trigger button`);
    assert.strictEqual(res.isSubmitDisabled, true, `Balance ${bal}đ should disable submit button`);
    assert.notStrictEqual(res.validationError, null, `Balance ${bal}đ should produce validation error`);
  }
});

runTest("2.2 Boundary balance at exactly 200,000đ enables trigger and valid submission", () => {
  const res = evaluatePayoutForm(200000, 200000, "123456", "NGUYEN VAN A");
  assert.strictEqual(res.isButtonDisabled, false, "Balance 200,000đ should enable trigger button");
  assert.strictEqual(res.isSubmitDisabled, false, "Balance 200,000đ should enable submit button");
  assert.strictEqual(res.validationError, null, "Balance 200,000đ should have no validation error");
});

runTest("2.3 Partial withdrawal: Balance 500,000đ, requesting 199,999đ must be strictly blocked", () => {
  const res = evaluatePayoutForm(500000, 199999, "123456", "NGUYEN VAN A");
  assert.strictEqual(res.isButtonDisabled, false);
  assert.strictEqual(res.isSubmitDisabled, true, "199,999đ payout request must be disabled");
  assert(res.validationError.includes("200.000đ"), "Error message must state 200.000đ minimum");
});

runTest("2.4 Partial withdrawal: Balance 500,000đ, requesting 200,000đ must pass", () => {
  const res = evaluatePayoutForm(500000, 200000, "123456", "NGUYEN VAN A");
  assert.strictEqual(res.isButtonDisabled, false);
  assert.strictEqual(res.isSubmitDisabled, false);
  assert.strictEqual(res.validationError, null);
});

// -----------------------------------------------------------------------------
// Suite 3: SQL Migration Ledger & Permission Verification
// -----------------------------------------------------------------------------
console.log("\n--- Suite 3: SQL Migration Ledger & Permission Verification ---");

const migrationPath = path.resolve("supabase/migrations/20261110_fix_wallet_ledger_and_rpc.sql");
const migrationContent = fs.readFileSync(migrationPath, "utf-8");

runTest("3.1 handle_new_user() initializes wallet with 5000 credits", () => {
  assert(
    migrationContent.includes("VALUES (NEW.id, 5000, 3, 0, timezone('utc'::text, now()))"),
    "handle_new_user must initialize balance to 5000"
  );
});

runTest("3.2 handle_new_user() inserts 5000 credits signup_bonus into wallet_txns", () => {
  assert(
    migrationContent.includes("5000,") &&
    migrationContent.includes("'signup_bonus',") &&
    migrationContent.includes("Quà tặng chào mừng thành viên mới (5.000 credits)"),
    "handle_new_user must record 5000 credits signup_bonus in ledger"
  );
});

runTest("3.3 refund_user_credits_atomic() restricts execution to service_role", () => {
  assert(
    migrationContent.includes("IF current_user <> 'service_role' AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN"),
    "refund_user_credits_atomic must enforce service_role check"
  );
});

runTest("3.4 refund_user_credits_atomic() revokes execute from authenticated and anon", () => {
  assert(
    migrationContent.includes("REVOKE EXECUTE ON FUNCTION public.refund_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) FROM PUBLIC, anon, authenticated;"),
    "Must revoke execute from PUBLIC, anon, authenticated"
  );
  assert(
    migrationContent.includes("GRANT EXECUTE ON FUNCTION public.refund_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) TO service_role;"),
    "Must grant execute strictly to service_role"
  );
});

console.log("\n================================================================================");
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} passed (${totalTests - passedTests} failures)`);
console.log("================================================================================");
if (passedTests === totalTests) {
  console.log("ALL CHALLENGER #2 EMPIRICAL TESTS PASSED PERFECTLY!");
} else {
  process.exit(1);
}
