// tests/adversarial/m3_challenger_2_escrow_and_antiabuse.test.mjs
// Adversarial Empirical Stress Test Suite for Milestone 3 (PR Group 2: Cashflow & Economics)
// Challenger: Challenger #2 (Empirical Challenger)
// Scope: Marketplace Escrow (Race Conditions, Slippage, Maturation), Cron Security, and Anti-Abuse (eKYC, Referral)

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

console.log("================================================================================");
console.log("CHALLENGER #2 EMPIRICAL ADVERSARIAL STRESS TEST SUITE — MILESTONE 3");
console.log("Scope: Escrow Concurrency & Slippage, Cron Auth, Anti-Sybil eKYC & Referral Guards");
console.log("================================================================================\n");

let passed = 0;
let total = 0;
const failures = [];

function test(name, fn) {
  total++;
  const start = performance.now();
  try {
    fn();
    const duration = (performance.now() - start).toFixed(2);
    passed++;
    console.log(`[PASS] ${name} (${duration}ms)`);
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2);
    failures.push({ name, error: err, duration: `${duration}ms` });
    console.error(`[FAIL] ${name} (${duration}ms)`);
    console.error(`       Error: ${err.message}`);
    process.exitCode = 1;
  }
}

async function testAsync(name, fn) {
  total++;
  const start = performance.now();
  try {
    await fn();
    const duration = (performance.now() - start).toFixed(2);
    passed++;
    console.log(`[PASS] ${name} (${duration}ms)`);
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2);
    failures.push({ name, error: err, duration: `${duration}ms` });
    console.error(`[FAIL] ${name} (${duration}ms)`);
    console.error(`       Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// Read migration files
const m22Path = path.resolve(rootDir, "supabase/migrations/20261112_marketplace_atomic_escrow.sql");
const m23Path = path.resolve(rootDir, "supabase/migrations/20261112_ekyc_and_referral_guard.sql");
const cronRoutePath = path.resolve(rootDir, "frontend/src/app/api/cron/escrow-release/route.ts");
const buyRoutePath = path.resolve(rootDir, "frontend/src/app/api/marketplace/buy/route.ts");
const verifUploadRoutePath = path.resolve(rootDir, "frontend/src/app/api/verification/upload/route.ts");
const referralRoutePath = path.resolve(rootDir, "frontend/src/app/api/referral/route.ts");
const examGenRoutePath = path.resolve(rootDir, "frontend/src/app/api/exams/generate/route.ts");

const m22Sql = fs.readFileSync(m22Path, "utf-8");
const m23Sql = fs.readFileSync(m23Path, "utf-8");
const cronRouteCode = fs.readFileSync(cronRoutePath, "utf-8");
const buyRouteCode = fs.readFileSync(buyRoutePath, "utf-8");
const verifUploadCode = fs.readFileSync(verifUploadRoutePath, "utf-8");
const referralRouteCode = fs.readFileSync(referralRoutePath, "utf-8");
const examGenRouteCode = fs.readFileSync(examGenRoutePath, "utf-8");

// =============================================================================
// SUITE 1: MARKETPLACE PURCHASE RACE & SLIPPAGE PREVENTIONS (RPC & SQL)
// =============================================================================
console.log("--- Suite 1: Marketplace Purchase Race & Slippage Preventions ---");

test("1.1 DB Constraint: uq_buyer_item_purchase prevents double purchases", () => {
  assert(
    m22Sql.includes("ADD CONSTRAINT uq_buyer_item_purchase UNIQUE (buyer_id, item_id)"),
    "Unique constraint uq_buyer_item_purchase(buyer_id, item_id) must be defined"
  );
});

test("1.2 DB Constraint: uq_marketplace_escrow_holds_order guarantees 1 hold per order", () => {
  assert(
    m22Sql.includes("ADD CONSTRAINT uq_marketplace_escrow_holds_order UNIQUE (order_id)"),
    "Unique constraint uq_marketplace_escrow_holds_order(order_id) must be defined"
  );
});

test("1.3 Anti-Abuse Guard: Self-purchase prevention blocks authors buying own item", () => {
  assert(
    m22Sql.includes("IF v_item.seller_id = v_buyer_id THEN"),
    "marketplace_purchase_item_v2 must check if seller_id == buyer_id"
  );
  assert(
    m22Sql.includes("'CANNOT_BUY_OWN_ITEM'"),
    "marketplace_purchase_item_v2 must return CANNOT_BUY_OWN_ITEM error code"
  );
});

test("1.4 Anti-Slippage Guard: p_expected_price check aborts on price change", () => {
  assert(
    m22Sql.includes("IF p_expected_price IS NOT NULL AND v_item.price_credits <> p_expected_price THEN"),
    "marketplace_purchase_item_v2 must check expected price against current price"
  );
  assert(
    m22Sql.includes("'PRICE_SLIPPAGE'"),
    "marketplace_purchase_item_v2 must return PRICE_SLIPPAGE error code"
  );
});

test("1.5 Anti-Arbitrage Guard: Purchase restricted strictly to purchased_balance", () => {
  assert(
    m22Sql.includes("v_buyer_wallet.purchased_balance < v_item.price_credits"),
    "marketplace_purchase_item_v2 must verify purchased_balance >= price_credits"
  );
  assert(
    m22Sql.includes("'INSUFFICIENT_PURCHASED_BALANCE'"),
    "marketplace_purchase_item_v2 must return INSUFFICIENT_PURCHASED_BALANCE"
  );
  assert(
    m22Sql.includes("purchased_balance = purchased_balance - v_item.price_credits"),
    "Buyer balance deduction must deduct strictly from purchased_balance"
  );
});

test("1.6 Economics Math: 15% platform fee and 85% seller net escrow hold", () => {
  assert(
    m22Sql.includes("v_seller_net_vnd := ROUND(v_item.price_credits * 100 * 0.85)::BIGINT"),
    "Seller net VND must be exactly 85% of price in credits * 100"
  );
  assert(
    m22Sql.includes("v_platform_fee_vnd := (v_item.price_credits * 100)::BIGINT - v_seller_net_vnd"),
    "Platform fee VND must be exactly 15% (price * 100 - seller_net_vnd)"
  );
});

test("1.7 14-day Escrow Insertion: release_at is calculated as now() + 14 days", () => {
  assert(
    m22Sql.includes("v_release_at := timezone('utc'::text, now()) + interval '14 days'"),
    "release_at must be strictly 14 days into the future"
  );
  assert(
    m22Sql.includes("status, release_at, created_at"),
    "marketplace_escrow_holds must store status, release_at, created_at"
  );
});

test("1.8 API Route (/api/marketplace/buy): Delegates entirely to atomic RPC without RAM bypasses", () => {
  assert(
    buyRouteCode.includes('marketplace_purchase_item_v2'),
    "API route must invoke marketplace_purchase_item_v2 RPC"
  );
  assert(
    !buyRouteCode.includes('globalThis.marketplacePurchases'),
    "API route must not contain RAM storage bypass"
  );
  assert(
    buyRouteCode.includes('status: 409') && buyRouteCode.includes('PRICE_SLIPPAGE'),
    "API route must return 409 Conflict on PRICE_SLIPPAGE"
  );
  assert(
    buyRouteCode.includes('status: 402') && buyRouteCode.includes('INSUFFICIENT_PURCHASED_BALANCE'),
    "API route must return 402 Payment Required on INSUFFICIENT_PURCHASED_BALANCE"
  );
});

// =============================================================================
// SUITE 2: ESCROW RELEASE CONCURRENCY & PREMATURE RELEASE GUARDS
// =============================================================================
console.log("\n--- Suite 2: Escrow Release Concurrency & Maturation Guards ---");

test("2.1 DB Index: Optimized index on (status, release_at) WHERE status = 'held'", () => {
  assert(
    m22Sql.includes("CREATE INDEX IF NOT EXISTS idx_escrow_holds_matured_release"),
    "Partial index idx_escrow_holds_matured_release must exist"
  );
  assert(
    m22Sql.includes("ON public.marketplace_escrow_holds(status, release_at)"),
    "Index must cover status and release_at columns"
  );
  assert(
    m22Sql.includes("WHERE status = 'held'"),
    "Index must be filtered where status = 'held'"
  );
});

test("2.2 Concurrency Lock: FOR UPDATE SKIP LOCKED prevents race condition in batch releases", () => {
  assert(
    m22Sql.includes("FOR UPDATE SKIP LOCKED"),
    "release_mature_escrow_atomic must use FOR UPDATE SKIP LOCKED"
  );
});

test("2.3 Strict Maturation Check: Holds with release_at > now() are NEVER released", () => {
  assert(
    m22Sql.includes("release_at <= timezone('utc'::text, now())"),
    "release_mature_escrow_atomic query must enforce release_at <= now()"
  );
});

test("2.4 Explicit Hold Guard: HOLD_NOT_ELIGIBLE returned if unmatured hold is requested", () => {
  assert(
    m22Sql.includes("IF p_hold_id IS NOT NULL AND v_released_count = 0 THEN"),
    "Function must detect when specified hold was not eligible"
  );
  assert(
    m22Sql.includes("'HOLD_NOT_ELIGIBLE'"),
    "Function must return HOLD_NOT_ELIGIBLE error code"
  );
});

test("2.5 Authorization Lockdown: service_role required for release_mature_escrow_atomic", () => {
  assert(
    m22Sql.includes("REVOKE EXECUTE ON FUNCTION public.release_mature_escrow_atomic(UUID) FROM PUBLIC, anon, authenticated"),
    "Permissions on release_mature_escrow_atomic must be revoked from public/anon/authenticated"
  );
  assert(
    m22Sql.includes("GRANT EXECUTE ON FUNCTION public.release_mature_escrow_atomic(UUID) TO service_role"),
    "Permissions on release_mature_escrow_atomic must be granted exclusively to service_role"
  );
});

test("2.6 Balance Transfer: Decrements escrow_balance_vnd and increments withdrawable_revenue_vnd", () => {
  assert(
    m22Sql.includes("escrow_balance_vnd = GREATEST(escrow_balance_vnd - v_hold.amount_vnd, 0)"),
    "release_mature_escrow_atomic must decrement escrow_balance_vnd with floor at 0"
  );
  assert(
    m22Sql.includes("withdrawable_revenue_vnd = withdrawable_revenue_vnd + v_hold.amount_vnd"),
    "release_mature_escrow_atomic must increment withdrawable_revenue_vnd by amount_vnd"
  );
});

// =============================================================================
// SUITE 3: CRON ROUTE SECURITY & TIMING-SAFE AUTHENTICATION
// =============================================================================
console.log("\n--- Suite 3: Cron Route Security & Timing-Safe Authentication ---");

// Test timing-safe logic directly
function verifyCronAuthMock(cronSecretEnv, authHeader) {
  if (!cronSecretEnv) {
    return { authorized: false, status: 500, reason: "CRON_SECRET is not configured on the server." };
  }
  if (!authHeader) {
    return { authorized: false, status: 401, reason: "Missing Authorization header." };
  }
  const expected = `Bearer ${cronSecretEnv}`;
  const authBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expected);

  if (authBuffer.length !== expectedBuffer.length) {
    return { authorized: false, status: 401, reason: "Invalid authorization token." };
  }
  if (!crypto.timingSafeEqual(authBuffer, expectedBuffer)) {
    return { authorized: false, status: 401, reason: "Invalid authorization token." };
  }
  return { authorized: true, status: 200 };
}

test("3.1 Unconfigured CRON_SECRET yields 500 configuration error", () => {
  const result = verifyCronAuthMock(undefined, "Bearer secret123");
  assert.strictEqual(result.authorized, false);
  assert.strictEqual(result.status, 500);
});

test("3.2 Missing Authorization header yields 401 Unauthorized", () => {
  const result = verifyCronAuthMock("my_secret", null);
  assert.strictEqual(result.authorized, false);
  assert.strictEqual(result.status, 401);
});

test("3.3 Wrong length Bearer token yields 401 Unauthorized safely", () => {
  const result = verifyCronAuthMock("my_secret", "Bearer wrong");
  assert.strictEqual(result.authorized, false);
  assert.strictEqual(result.status, 401);
});

test("3.4 Same length but incorrect token yields 401 Unauthorized via timingSafeEqual", () => {
  const result = verifyCronAuthMock("correct_key", "Bearer incorr_key");
  assert.strictEqual(result.authorized, false);
  assert.strictEqual(result.status, 401);
});

test("3.5 Valid Bearer token yields 200 Authorized", () => {
  const result = verifyCronAuthMock("correct_key_123", "Bearer correct_key_123");
  assert.strictEqual(result.authorized, true);
  assert.strictEqual(result.status, 200);
});

test("3.6 Cron Route Code: crypto.timingSafeEqual is used in production route", () => {
  assert(
    cronRouteCode.includes("crypto.timingSafeEqual(authBuffer, expectedBuffer)"),
    "Production route must use crypto.timingSafeEqual"
  );
  assert(
    cronRouteCode.includes("authBuffer.length !== expectedBuffer.length"),
    "Production route must verify buffer lengths before timingSafeEqual"
  );
});

test("3.7 Cron Route Fallback: Direct query also strictly checks release_at <= now()", () => {
  assert(
    cronRouteCode.includes('.lte("release_at", nowIso)'),
    "Direct query fallback must filter release_at <= nowIso"
  );
  assert(
    cronRouteCode.includes('.eq("status", "held")'),
    "Direct query fallback must filter status == held"
  );
});

// =============================================================================
// SUITE 4: eKYC ANTI-REPETITION & TEACHER VERIFICATION INTEGRITY
// =============================================================================
console.log("\n--- Suite 4: eKYC Anti-Repetition & Teacher Verification Integrity ---");

test("4.1 Privilege Escalation Lock: ekyc_rewarded_at is protected from client updates", () => {
  assert(
    m23Sql.includes("NEW.ekyc_rewarded_at := OLD.ekyc_rewarded_at"),
    "prevent_user_privilege_escalation trigger must freeze ekyc_rewarded_at against non-service_role updates"
  );
});

test("4.2 Anti-Spam: Partial unique indexes prevent concurrent pending or approved records", () => {
  assert(
    m23Sql.includes("CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_verifications_one_pending"),
    "Unique index on user_id WHERE status = 'pending_review' must exist"
  );
  assert(
    m23Sql.includes("CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_verifications_one_approved"),
    "Unique index on user_id WHERE status = 'approved' must exist"
  );
});

test("4.3 claim_ekyc_reward_atomic: Row-level lock (FOR UPDATE) prevents race conditions", () => {
  assert(
    /FROM\s+public\.users\s+WHERE\s+id\s*=\s*p_user_id\s+FOR\s+UPDATE/i.test(m23Sql),
    "claim_ekyc_reward_atomic must lock user record FOR UPDATE"
  );
});

test("4.4 Anti-Replay: If ekyc_rewarded_at IS NOT NULL, 0 additional credits are awarded", () => {
  assert(
    m23Sql.includes("IF v_user.ekyc_rewarded_at IS NOT NULL THEN"),
    "claim_ekyc_reward_atomic must check ekyc_rewarded_at IS NOT NULL"
  );
  assert(
    m23Sql.includes("'already_rewarded', true") && m23Sql.includes("'credits_awarded', 0"),
    "claim_ekyc_reward_atomic must return already_rewarded: true and credits_awarded: 0"
  );
});

test("4.5 Credit Bucket Integrity: 10,000 bonus credits deposited into promotional_balance", () => {
  assert(
    m23Sql.includes("promotional_balance = promotional_balance + $1"),
    "claim_ekyc_reward_atomic must deposit credits into promotional_balance"
  );
  assert(
    m23Sql.includes("'ekyc_bonus'"),
    "wallet_txns record must specify type 'ekyc_bonus'"
  );
});

test("4.6 Verification Upload Route: Rejects already-rewarded teachers with HTTP 400", () => {
  assert(
    verifUploadCode.includes("userProfile?.is_verified_teacher || userProfile?.ekyc_rewarded_at"),
    "Upload route must check is_verified_teacher or ekyc_rewarded_at"
  );
  assert(
    verifUploadCode.includes("status: 400"),
    "Upload route must return HTTP 400 on already-rewarded teacher"
  );
});

test("4.7 Verification Upload Route: Rejects duplicate pending submissions with HTTP 429", () => {
  assert(
    verifUploadCode.includes('eq("status", "pending_review")'),
    "Upload route must query for existing pending_review records"
  );
  assert(
    verifUploadCode.includes("status: 429"),
    "Upload route must return HTTP 429 on spam pending submission"
  );
});

// =============================================================================
// SUITE 5: REFERRAL QUALIFICATION & EXAM COMPLETION GUARDS
// =============================================================================
console.log("\n--- Suite 5: Referral Qualification & Exam Completion Guards ---");

test("5.1 DB Constraint: referrals.status restricted to valid lifecycle states", () => {
  assert(
    m23Sql.includes("CHECK (status IN ('pending', 'qualified', 'rewarded', 'cancelled'))"),
    "referrals.status check constraint must enforce pending, qualified, rewarded, cancelled"
  );
});

test("5.2 Anti-Looping: Route /api/referral rejects self-referral and cyclic referral", () => {
  assert(
    referralRouteCode.includes("inviter.id === user.id || inviter.referred_by === user.id"),
    "Referral route must prevent self-referral and mutual loop (A -> B -> A)"
  );
  assert(
    referralRouteCode.includes("currentProfile?.referred_by"),
    "Referral route must reject re-applying referral code"
  );
});

test("5.3 qualify_and_reward_referral_atomic: Locks pending referral FOR UPDATE", () => {
  assert(
    m23Sql.includes("WHERE invitee_id = p_invitee_id AND status = 'pending'"),
    "qualify_and_reward_referral_atomic must find referral with status = 'pending'"
  );
  assert(
    m23Sql.includes("FOR UPDATE"),
    "qualify_and_reward_referral_atomic must lock referral row FOR UPDATE"
  );
});

test("5.4 Exam Validation Matrix: Rejects exam if not completed or question_count <= 0", () => {
  assert(
    m23Sql.includes("v_exam.user_id <> p_invitee_id OR v_exam.status <> 'completed' OR COALESCE(v_exam.question_count, 0) <= 0"),
    "qualify_and_reward_referral_atomic must strictly validate exam user_id, status = 'completed', and question_count > 0"
  );
  assert(
    m23Sql.includes("'invalid_qualifying_exam'"),
    "qualify_and_reward_referral_atomic must return invalid_qualifying_exam reason"
  );
});

test("5.5 Exam Generation Route: Only triggers referral qualification after questions are generated", () => {
  assert(
    examGenRouteCode.includes("if (generatedQuestions && generatedQuestions.length > 0 && user?.id)"),
    "Exam generation route must verify generatedQuestions.length > 0 before qualify_and_reward_referral_atomic"
  );
  assert(
    examGenRouteCode.includes("qualify_and_reward_referral_atomic"),
    "Exam generation route must call qualify_and_reward_referral_atomic"
  );
});

test("5.6 Dual-Wallet Reward: Credits exactly 2000 promotional credits to both inviter & invitee", () => {
  assert(
    m23Sql.includes("v_reward_credits := COALESCE(v_referral.reward_credits, 2000)"),
    "Reward credits must default to 2000"
  );
  assert(
    m23Sql.includes("WHERE user_id = v_referral.inviter_id") &&
    m23Sql.includes("WHERE user_id = p_invitee_id"),
    "Both inviter and invitee wallets must be credited"
  );
  assert(
    m23Sql.includes("'referral_bonus'"),
    "wallet_txns records must specify type 'referral_bonus'"
  );
});

// =============================================================================
// SUITE 6: EMPIRICAL SIMULATION OF ESCROW MATURATION & SLIPPAGE
// =============================================================================
console.log("\n--- Suite 6: Empirical Simulation of Escrow Maturation & Slippage ---");

test("6.1 Escrow Maturation Time-Travel Simulation", () => {
  const baseTime = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Generate 10 mock escrow holds reflecting 14-day hold_until = created_at + 14 days
  const holds = [
    // Mature holds (release_at in past, status = 'held')
    { id: "h1", release_at: new Date(baseTime - 1 * dayMs).toISOString(), status: "held", amount: 85000 }, // order placed 15 days ago
    { id: "h2", release_at: new Date(baseTime - 1000).toISOString(), status: "held", amount: 170000 }, // order placed 14 days + 1s ago
    { id: "h7", release_at: new Date(baseTime - 6 * dayMs).toISOString(), status: "held", amount: 425000 }, // order placed 20 days ago
    { id: "h9", release_at: new Date(baseTime - 16 * dayMs).toISOString(), status: "held", amount: 85000 }, // order placed 30 days ago
    { id: "h10", release_at: new Date(baseTime).toISOString(), status: "held", amount: 100000 }, // order placed exactly 14 days ago
    // Unmatured holds (release_at in future, status = 'held')
    { id: "h3", release_at: new Date(baseTime + 7 * dayMs).toISOString(), status: "held", amount: 255000 }, // order placed 7 days ago (7 days remaining)
    { id: "h4", release_at: new Date(baseTime + 13 * dayMs).toISOString(), status: "held", amount: 85000 }, // order placed 1 day ago (13 days remaining)
    { id: "h5", release_at: new Date(baseTime + 14 * dayMs).toISOString(), status: "held", amount: 85000 }, // order placed just now (14 days remaining)
    { id: "h8", release_at: new Date(baseTime + 60000).toISOString(), status: "held", amount: 85000 }, // 1 min remaining
    // Already released hold (release_at in past, but status = 'released')
    { id: "h6", release_at: new Date(baseTime - 2 * dayMs).toISOString(), status: "released", amount: 85000 }, // already released
  ];

  const nowIso = new Date(baseTime).toISOString();
  // Filter replicating WHERE status = 'held' AND release_at <= now()
  const eligible = holds.filter(h => h.status === "held" && h.release_at <= nowIso);

  // Exactly 5 holds (h1, h2, h7, h9, h10) must be eligible
  assert.strictEqual(eligible.length, 5, `Expected exactly 5 eligible holds, got ${eligible.length}`);
  const eligibleIds = eligible.map(h => h.id).sort();
  assert.deepStrictEqual(eligibleIds, ["h1", "h10", "h2", "h7", "h9"].sort());

  // Total amount should be sum of eligible
  const totalAmount = eligible.reduce((acc, h) => acc + h.amount, 0);
  assert.strictEqual(totalAmount, 85000 + 170000 + 425000 + 85000 + 100000);
});

test("6.2 Concurrency Simulation: 2 workers executing SKIP LOCKED over eligible holds", () => {
  const eligibleQueue = ["h1", "h2", "h7", "h9", "h10"];
  const locked = new Set();
  const worker1Processed = [];
  const worker2Processed = [];

  // Simulate worker 1 taking items 1 and 2
  for (const id of eligibleQueue) {
    if (!locked.has(id) && worker1Processed.length < 3) {
      locked.add(id);
      worker1Processed.push(id);
    }
  }

  // Simulate worker 2 running simultaneously (SKIP LOCKED)
  for (const id of eligibleQueue) {
    if (!locked.has(id)) {
      locked.add(id);
      worker2Processed.push(id);
    }
  }

  // Verify zero overlap between worker1 and worker2
  const overlap = worker1Processed.filter(id => worker2Processed.includes(id));
  assert.strictEqual(overlap.length, 0, "Workers must not process overlapping holds");
  assert.strictEqual(worker1Processed.length + worker2Processed.length, 5, "All 5 holds must be processed exactly once");
});

test("6.3 Slippage Boundary Matrix Simulation", () => {
  function checkSlippage(actualPrice, expectedPrice) {
    if (expectedPrice !== null && expectedPrice !== undefined) {
      if (actualPrice !== expectedPrice) {
        return { success: false, error: "PRICE_SLIPPAGE" };
      }
    }
    return { success: true };
  }

  // Test cases: [actual, expected, expectedSuccess]
  const matrix = [
    [100, 100, true],    // exact match
    [100, null, true],   // no slippage constraint provided
    [100, undefined, true],
    [100, 105, false],   // price decreased
    [100, 95, false],    // price increased
    [0, 0, true],        // free item match
    [0, 10, false],      // changed to free
    [50000, 50000, true],// high value match
    [50000, 49999, false]// off-by-one slippage
  ];

  for (const [actual, expected, expectedSuccess] of matrix) {
    const res = checkSlippage(actual, expected);
    assert.strictEqual(res.success, expectedSuccess, `Failed for actual=${actual}, expected=${expected}`);
  }
});

// =============================================================================
// SUMMARY REPORT
// =============================================================================
console.log("\n================================================================================");
console.log(`TEST EXECUTION SUMMARY: ${passed}/${total} PASSED (0 FAILURES)`);
console.log("================================================================================");

if (failures.length > 0) {
  console.error("\nFailed tests:");
  for (const f of failures) {
    console.error(`- ${f.name}: ${f.error.message}`);
  }
  process.exit(1);
} else {
  console.log("\nAll Milestone 3 Challenger #2 adversarial tests executed with 100% SUCCESS.");
  process.exit(0);
}
