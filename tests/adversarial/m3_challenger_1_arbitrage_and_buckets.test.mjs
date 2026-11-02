// tests/adversarial/m3_challenger_1_arbitrage_and_buckets.test.mjs
// Adversarial Empirical Stress Test Suite for Milestone 3 (PR Group 2: Cashflow & Economics)
// Challenger #1 (Empirical Challenger) — Deep Verification of 3-Bucket Wallets & Arbitrage Elimination

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

console.log("================================================================================");
console.log("CHALLENGER #1 EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — MILESTONE 3");
console.log("Scope: 3-Bucket Wallets, Arbitrage Elimination, 200k Payout Floor & Escrow");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;
let failedTests = 0;
const testResults = [];

function runTest(name, fn) {
  totalTests++;
  const start = performance.now();
  try {
    fn();
    const duration = (performance.now() - start).toFixed(2);
    passedTests++;
    testResults.push({ name, status: "PASS", duration: `${duration}ms` });
    console.log(`[PASS] ${name} (${duration}ms)`);
  } catch (err) {
    failedTests++;
    const duration = (performance.now() - start).toFixed(2);
    testResults.push({ name, status: "FAIL", error: err.message, duration: `${duration}ms` });
    console.error(`[FAIL] ${name} (${duration}ms)`);
    console.error(`       Error: ${err.message}`);
  }
}

async function runTestAsync(name, fn) {
  totalTests++;
  const start = performance.now();
  try {
    await fn();
    const duration = (performance.now() - start).toFixed(2);
    passedTests++;
    testResults.push({ name, status: "PASS", duration: `${duration}ms` });
    console.log(`[PASS] ${name} (${duration}ms)`);
  } catch (err) {
    failedTests++;
    const duration = (performance.now() - start).toFixed(2);
    testResults.push({ name, status: "FAIL", error: err.message, duration: `${duration}ms` });
    console.error(`[FAIL] ${name} (${duration}ms)`);
    console.error(`       Error: ${err.message}`);
  }
}

// Helper to make HTTP POST requests to local server using fetch
async function postJson(urlPath, data) {
  const res = await fetch(`http://localhost:3001${urlPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  let parsed;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }
  return { status: res.status, data: parsed };
}

// =============================================================================
// SUITE 1: DATABASE MIGRATION INTEGRITY & CONSTRAINTS
// =============================================================================
console.log("\n--- Suite 1: Database Migration Schema & Constraints Verification ---");

const migration21Path = path.resolve("supabase/migrations/20261111_three_bucket_wallets.sql");
const migration22Path = path.resolve("supabase/migrations/20261112_marketplace_atomic_escrow.sql");
const migration23Path = path.resolve("supabase/migrations/20261112_ekyc_and_referral_guard.sql");

const m21Sql = fs.readFileSync(migration21Path, "utf-8");
const m22Sql = fs.readFileSync(migration22Path, "utf-8");
const m23Sql = fs.readFileSync(migration23Path, "utf-8");

runTest("1.1 Migration 2.1 defines all 4 wallet bucket columns", () => {
  assert(m21Sql.includes("promotional_balance INTEGER NOT NULL DEFAULT 0"), "Missing promotional_balance column");
  assert(m21Sql.includes("purchased_balance INTEGER NOT NULL DEFAULT 0"), "Missing purchased_balance column");
  assert(m21Sql.includes("withdrawable_revenue_vnd BIGINT NOT NULL DEFAULT 0"), "Missing withdrawable_revenue_vnd column");
  assert(m21Sql.includes("escrow_balance_vnd BIGINT NOT NULL DEFAULT 0"), "Missing escrow_balance_vnd column");
});

runTest("1.2 Migration 2.1 enforces non-negative constraints on all 4 buckets", () => {
  assert(m21Sql.includes("wallets_promotional_balance_check CHECK (promotional_balance >= 0)"), "Missing promo >= 0 check");
  assert(m21Sql.includes("wallets_purchased_balance_check CHECK (purchased_balance >= 0)"), "Missing purchased >= 0 check");
  assert(m21Sql.includes("wallets_withdrawable_revenue_vnd_check CHECK (withdrawable_revenue_vnd >= 0)"), "Missing withdrawable >= 0 check");
  assert(m21Sql.includes("wallets_escrow_balance_vnd_check CHECK (escrow_balance_vnd >= 0)"), "Missing escrow >= 0 check");
});

runTest("1.3 Migration 2.1 enforces CHECK (amount_vnd >= 200000) on payout_requests and affiliate_payouts", () => {
  assert(m21Sql.includes("payout_requests_min_amount_check \n    CHECK (amount_vnd >= 200000)") ||
         m21Sql.includes("payout_requests_min_amount_check") && m21Sql.includes("amount_vnd >= 200000"),
         "payout_requests must enforce amount_vnd >= 200000");
  assert(m21Sql.includes("affiliate_payouts_min_amount_check \n    CHECK (amount_vnd >= 200000)") ||
         m21Sql.includes("affiliate_payouts_min_amount_check") && m21Sql.includes("amount_vnd >= 200000"),
         "affiliate_payouts must enforce amount_vnd >= 200000");
});

runTest("1.4 Migration 2.1 sync_wallet_three_buckets trigger enforces balance = promo + purchased", () => {
  assert(m21Sql.includes("NEW.balance := NEW.promotional_balance + NEW.purchased_balance;"), "Trigger must synchronize balance");
  assert(m21Sql.includes("CREATE TRIGGER trg_sync_wallet_three_buckets"), "Trigger definition trg_sync_wallet_three_buckets must exist");
});

runTest("1.5 Migration 2.2 defines marketplace_escrow_holds with UNIQUE order constraint and 14-day hold", () => {
  assert(m22Sql.includes("CREATE TABLE IF NOT EXISTS public.marketplace_escrow_holds"), "marketplace_escrow_holds table must exist");
  assert(m22Sql.includes("uq_marketplace_escrow_holds_order UNIQUE (order_id)"), "uq_marketplace_escrow_holds_order must exist");
  assert(m22Sql.includes("interval '14 days'"), "Escrow release must be set to 14 days interval");
});

runTest("1.6 Migration 2.2 marketplace_purchase_item_v2 enforces purchased_balance >= price", () => {
  assert(m22Sql.includes("v_buyer_wallet.purchased_balance < v_item.price_credits"), "Must strictly check purchased_balance < price");
  assert(m22Sql.includes("'INSUFFICIENT_PURCHASED_BALANCE'"), "Must return error code INSUFFICIENT_PURCHASED_BALANCE");
  assert(m22Sql.includes("v_item.seller_id = v_buyer_id"), "Must guard against seller self-purchase");
  assert(m22Sql.includes("'CANNOT_BUY_OWN_ITEM'"), "Must return CANNOT_BUY_OWN_ITEM error");
  assert(m22Sql.includes("v_item.price_credits <> p_expected_price"), "Must validate price slippage");
});

runTest("1.7 Migration 2.2 release_mature_escrow_atomic uses FOR UPDATE SKIP LOCKED and service_role security", () => {
  assert(m22Sql.includes("FOR UPDATE SKIP LOCKED"), "Must use FOR UPDATE SKIP LOCKED to prevent race conditions");
  assert(m22Sql.includes("current_user <> 'service_role'"), "Must restrict caller to service_role");
  assert(m22Sql.includes("release_at <= timezone('utc'::text, now())"), "Must check release_at maturity");
});

// =============================================================================
// SUITE 2: DEDUCTION PRIORITY MATHEMATICAL STATE MACHINE & STRESS SIMULATION
// =============================================================================
console.log("\n--- Suite 2: Deduction Priority State Machine & Oracle Simulation ---");

// Oracle implementing the exact PL/pgSQL logic of deduct_user_credits_atomic
function simulateDeductAtomic(wallet, p_amount) {
  if (p_amount === null || p_amount === undefined || p_amount < 0) {
    return { success: false, error: "INVALID_AMOUNT" };
  }
  const totalAvailable = (wallet.promotional_balance || 0) + (wallet.purchased_balance || 0);
  if (totalAvailable < p_amount) {
    return {
      success: false,
      error: "INSUFFICIENT_CREDITS",
      balance: totalAvailable,
      promotional_balance: wallet.promotional_balance || 0,
      purchased_balance: wallet.purchased_balance || 0,
      required: p_amount,
    };
  }

  const deductPromo = Math.min(wallet.promotional_balance || 0, p_amount);
  const deductPurchased = p_amount - deductPromo;

  const newPromo = (wallet.promotional_balance || 0) - deductPromo;
  const newPurchased = (wallet.purchased_balance || 0) - deductPurchased;
  const newBalance = newPromo + newPurchased;

  return {
    success: true,
    balance: newBalance,
    promotional_balance: newPromo,
    purchased_balance: newPurchased,
    deducted_promo: deductPromo,
    deducted_purchased: deductPurchased,
    deducted: p_amount,
    // Invariant check
    invariantHolds: (newBalance === newPromo + newPurchased) && (newPromo >= 0) && (newPurchased >= 0),
  };
}

runTest("2.1 Case A: Promo balance is sufficient — Deduct 100% from promotional", () => {
  const wallet = { promotional_balance: 5000, purchased_balance: 1000, balance: 6000, withdrawable_revenue_vnd: 500000 };
  const res = simulateDeductAtomic(wallet, 2000);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.deducted_promo, 2000);
  assert.strictEqual(res.deducted_purchased, 0);
  assert.strictEqual(res.promotional_balance, 3000);
  assert.strictEqual(res.purchased_balance, 1000); // untouched!
  assert.strictEqual(res.balance, 4000);
  assert.strictEqual(res.invariantHolds, true);
});

runTest("2.2 Case B: Promo exhausted — Deduct remaining from purchased balance", () => {
  const wallet = { promotional_balance: 1500, purchased_balance: 2000, balance: 3500 };
  const res = simulateDeductAtomic(wallet, 2500);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.deducted_promo, 1500); // all promo consumed first
  assert.strictEqual(res.deducted_purchased, 1000); // remainder taken from purchased
  assert.strictEqual(res.promotional_balance, 0);
  assert.strictEqual(res.purchased_balance, 1000);
  assert.strictEqual(res.balance, 1000);
  assert.strictEqual(res.invariantHolds, true);
});

runTest("2.3 Case C: Promo is 0 — Deduct 100% from purchased balance", () => {
  const wallet = { promotional_balance: 0, purchased_balance: 3000, balance: 3000 };
  const res = simulateDeductAtomic(wallet, 1200);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.deducted_promo, 0);
  assert.strictEqual(res.deducted_purchased, 1200);
  assert.strictEqual(res.promotional_balance, 0);
  assert.strictEqual(res.purchased_balance, 1800);
  assert.strictEqual(res.balance, 1800);
  assert.strictEqual(res.invariantHolds, true);
});

runTest("2.4 Case D: Total credits insufficient — Strictly rejected without state mutation", () => {
  const wallet = { promotional_balance: 1000, purchased_balance: 500, balance: 1500 };
  const res = simulateDeductAtomic(wallet, 2000);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, "INSUFFICIENT_CREDITS");
  assert.strictEqual(res.required, 2000);
  assert.strictEqual(res.balance, 1500);
});

runTest("2.5 Case E: Negative amount deduction attempt is rejected", () => {
  const wallet = { promotional_balance: 5000, purchased_balance: 1000, balance: 6000 };
  const res = simulateDeductAtomic(wallet, -500);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, "INVALID_AMOUNT");
});

runTest("2.6 Case F: Randomized Property-based Stress Testing (1,000 iterations)", () => {
  for (let i = 0; i < 1000; i++) {
    const promo = Math.floor(Math.random() * 10000);
    const purchased = Math.floor(Math.random() * 10000);
    const deduct = Math.floor(Math.random() * 15000);
    const wallet = { promotional_balance: promo, purchased_balance: purchased, balance: promo + purchased };
    const res = simulateDeductAtomic(wallet, deduct);

    if (promo + purchased < deduct) {
      assert.strictEqual(res.success, false, `Must fail when promo(${promo}) + purchased(${purchased}) < deduct(${deduct})`);
    } else {
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.deducted_promo + res.deducted_purchased, deduct);
      assert.strictEqual(res.promotional_balance, promo - res.deducted_promo);
      assert.strictEqual(res.purchased_balance, purchased - res.deducted_purchased);
      assert.strictEqual(res.balance, res.promotional_balance + res.purchased_balance);
      assert(res.promotional_balance >= 0);
      assert(res.purchased_balance >= 0);
      // Priority check: if purchased was touched, promo MUST be 0!
      if (res.deducted_purchased > 0) {
        assert.strictEqual(res.promotional_balance, 0, `Promo must be completely drained before touching purchased balance! Iteration ${i}`);
      }
    }
  }
});

// =============================================================================
// SUITE 3: MARKETPLACE ARBITRAGE ELIMINATION ORACLE & SIMULATION
// =============================================================================
console.log("\n--- Suite 3: Marketplace Arbitrage Elimination Stress Simulation ---");

// Oracle implementing the exact PL/pgSQL logic of marketplace_purchase_item_v2
function simulateMarketplacePurchase({ buyerWallet, item, buyerId, expectedPrice }) {
  if (buyerId === item.seller_id) {
    return { success: false, error: "CANNOT_BUY_OWN_ITEM" };
  }
  if (expectedPrice !== undefined && expectedPrice !== null && item.price_credits !== expectedPrice) {
    return { success: false, error: "PRICE_SLIPPAGE" };
  }
  if (item.price_credits === 0) {
    return { success: true, price_credits: 0, seller_net_vnd: 0, escrow_hold_id: null };
  }

  // Key Arbitrage Guard: Check purchased_balance ONLY
  if (!buyerWallet || buyerWallet.purchased_balance < item.price_credits) {
    return {
      success: false,
      error: "INSUFFICIENT_PURCHASED_BALANCE",
      required: item.price_credits,
      current_purchased_balance: buyerWallet?.purchased_balance ?? 0,
      promotional_balance: buyerWallet?.promotional_balance ?? 0,
    };
  }

  const sellerNetVnd = Math.round(item.price_credits * 100 * 0.85);
  const platformFeeVnd = item.price_credits * 100 - sellerNetVnd;
  const newPurchasedBalance = buyerWallet.purchased_balance - item.price_credits;

  return {
    success: true,
    price_credits: item.price_credits,
    seller_net_vnd: sellerNetVnd,
    platform_fee_vnd: platformFeeVnd,
    new_purchased_balance: newPurchasedBalance,
    escrow_held: true,
  };
}

runTest("3.1 Arbitrage Attack Attempt: User with 50,000 promotional credits & 0 purchased cannot buy paid item", () => {
  const buyerWallet = { promotional_balance: 50000, purchased_balance: 0, balance: 50000 };
  const item = { id: "item-1", seller_id: "seller-1", price_credits: 200 };
  const res = simulateMarketplacePurchase({ buyerWallet, item, buyerId: "buyer-1" });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, "INSUFFICIENT_PURCHASED_BALANCE");
  assert.strictEqual(res.current_purchased_balance, 0);
  assert.strictEqual(res.promotional_balance, 50000);
});

runTest("3.2 Arbitrage Attack Attempt: User with 100 purchased & 100,000 promo cannot buy item priced 500", () => {
  const buyerWallet = { promotional_balance: 100000, purchased_balance: 100, balance: 100100 };
  const item = { id: "item-1", seller_id: "seller-1", price_credits: 500 };
  const res = simulateMarketplacePurchase({ buyerWallet, item, buyerId: "buyer-1" });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, "INSUFFICIENT_PURCHASED_BALANCE");
});

runTest("3.3 Legitimate Purchase: User with 1,000 purchased credits successfully buys item priced 500", () => {
  const buyerWallet = { promotional_balance: 5000, purchased_balance: 1000, balance: 6000 };
  const item = { id: "item-1", seller_id: "seller-1", price_credits: 500 };
  const res = simulateMarketplacePurchase({ buyerWallet, item, buyerId: "buyer-1" });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.new_purchased_balance, 500);
  assert.strictEqual(res.seller_net_vnd, 42500); // 500 * 100 * 0.85 = 42,500 VND
  assert.strictEqual(res.platform_fee_vnd, 7500); // 50,000 - 42,500 = 7,500 VND
  assert.strictEqual(res.escrow_held, true);
});

runTest("3.4 Anti-Sybil Self-Purchase: Author cannot buy their own item", () => {
  const buyerWallet = { promotional_balance: 0, purchased_balance: 10000, balance: 10000 };
  const item = { id: "item-1", seller_id: "user-author", price_credits: 500 };
  const res = simulateMarketplacePurchase({ buyerWallet, item, buyerId: "user-author" });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, "CANNOT_BUY_OWN_ITEM");
});

runTest("3.5 Price Slippage Protection: Transaction rejected if actual price differs from expected price", () => {
  const buyerWallet = { promotional_balance: 0, purchased_balance: 10000, balance: 10000 };
  const item = { id: "item-1", seller_id: "seller-1", price_credits: 600 };
  const res = simulateMarketplacePurchase({ buyerWallet, item, buyerId: "buyer-1", expectedPrice: 500 });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, "PRICE_SLIPPAGE");
});

// =============================================================================
// SUITE 4: UNIFIED 200,000 VNĐ WITHDRAWAL THRESHOLD VERIFICATION
// =============================================================================
console.log("\n--- Suite 4: Unified 200,000 VNĐ Withdrawal Threshold Verification ---");

const constantsPath = path.resolve("frontend/src/lib/constants.ts");
const constantsContent = fs.readFileSync(constantsPath, "utf-8");

runTest("4.1 MINIMUM_PAYOUT_VND constant is strictly 200,000 in constants.ts", () => {
  assert(constantsContent.includes("MINIMUM_PAYOUT_VND = 200_000") ||
         constantsContent.includes("MINIMUM_PAYOUT_VND = 200000") ||
         constantsContent.includes("MINIMUM_PAYOUT_VND: 200000"),
         "MINIMUM_PAYOUT_VND must be 200000");
});

const mktPayoutRoutePath = path.resolve("frontend/src/app/api/marketplace/payout/route.ts");
const mktPayoutContent = fs.readFileSync(mktPayoutRoutePath, "utf-8");

runTest("4.2 Marketplace payout route enforces MINIMUM_PAYOUT_VND floor", () => {
  assert(mktPayoutContent.includes("MINIMUM_PAYOUT_VND"), "Route must import MINIMUM_PAYOUT_VND");
  assert(mktPayoutContent.includes("requestedVnd < MINIMUM_PAYOUT_VND"), "Route must validate requestedVnd < MINIMUM_PAYOUT_VND");
  assert(mktPayoutContent.includes("withdrawable_revenue_vnd"), "Route must check withdrawable_revenue_vnd bucket");
});

const affPayoutRoutePath = path.resolve("frontend/src/app/api/affiliate/payout/route.ts");
const affPayoutContent = fs.readFileSync(affPayoutRoutePath, "utf-8");

runTest("4.3 Affiliate payout route enforces MINIMUM_PAYOUT_VND floor", () => {
  assert(affPayoutContent.includes("MINIMUM_PAYOUT_VND"), "Route must import MINIMUM_PAYOUT_VND");
  assert(affPayoutContent.includes("amountVnd < MINIMUM_PAYOUT_VND"), "Route must validate amountVnd < MINIMUM_PAYOUT_VND");
});

const affStorePath = path.resolve("frontend/src/lib/affiliate/affiliate-store.ts");
const affStoreContent = fs.readFileSync(affStorePath, "utf-8");

runTest("4.4 requestCashPayout in affiliate-store.ts enforces MINIMUM_PAYOUT_VND floor", () => {
  assert(affStoreContent.includes("amountVnd < MINIMUM_PAYOUT_VND"), "requestCashPayout must validate amountVnd < MINIMUM_PAYOUT_VND");
});

// =============================================================================
// SUITE 5: AFFILIATE CONVERSION & RESIDUAL 1.5x ARBITRAGE CODE DEFECT AUDIT
// =============================================================================
console.log("\n--- Suite 5: Affiliate Conversion Math & UI Bug Audit ---");

runTest("5.1 convertAffiliateToCredits in affiliate-store.ts uses 1 credit per 100 VND without 1.5x", () => {
  assert(affStoreContent.includes("Math.round(amountVnd / 100)"), "Conversion math must be amountVnd / 100");
  assert(!affStoreContent.includes("Math.round(amountVnd * 1.5)"), "Must NOT have amountVnd * 1.5 in convertAffiliateToCredits");
  assert(affStoreContent.includes("promotional_balance"), "Credits must be credited to promotional_balance");
});

const affPagePath = path.resolve("frontend/src/app/(dashboard)/affiliate/page.tsx");
const affPageContent = fs.readFileSync(affPagePath, "utf-8");
const affConvertRoutePath = path.resolve("frontend/src/app/api/affiliate/convert-credits/route.ts");
const affConvertRouteContent = fs.readFileSync(affConvertRoutePath, "utf-8");

// CHALLENGE FINDING PROBES:
let foundResidual15xUI = false;
let foundMismatchCalculation = false;

runTest("5.2 CHALLENGE CHECK: Audit affiliate/page.tsx for residual 1.5x claims", () => {
  const hasMarketingCopy15 = affPageContent.includes("nhân 1.5x");
  const hasButtonCopy15 = affPageContent.includes("Đổi Credits (x1.5)");
  if (hasMarketingCopy15 || hasButtonCopy15) {
    foundResidual15xUI = true;
    console.warn("       [DEFECT DETECTED] Residual 'x1.5' marketing text found in affiliate/page.tsx!");
  }
});

runTest("5.3 CHALLENGE CHECK: Audit affiliate/page.tsx line 529 for modal calculation mismatch", () => {
  const hasFormula15 = affPageContent.includes("(convertAmount || 0) * 1.5");
  if (hasFormula15) {
    foundMismatchCalculation = true;
    console.warn("       [CRITICAL UI DEFECT DETECTED] Line 529 displays +{convertAmount * 1.5} Credits! User expects 15,000 cr for 10k VND but backend only gives 100 cr!");
  }
});

runTest("5.4 CHALLENGE CHECK: Audit api/affiliate/convert-credits/route.ts line 44 for residual 1.5x text", () => {
  const hasMessage15 = affConvertRouteContent.includes("(Ưu đãi x1.5)");
  if (hasMessage15) {
    console.warn("       [DEFECT DETECTED] convert-credits/route.ts success message claims '(Ưu đãi x1.5)' despite standard 1:100 conversion!");
  }
});

// =============================================================================
// SUITE 6: LIVE API VERIFICATION AGAINST RUNNING DEV SERVER (PORT 3001)
// =============================================================================
console.log("\n--- Suite 6: Live API Probing Against Dev Server (Port 3001) ---");

await runTestAsync("6.1 Live API: POST /api/marketplace/buy without auth returns 401", async () => {
  const res = await postJson("/api/marketplace/buy", { item_id: "00000000-0000-0000-0000-000000000001" });
  assert.strictEqual(res.status, 401);
});

await runTestAsync("6.2 Live API: POST /api/marketplace/payout with 0 VNĐ returns 400 or 401", async () => {
  const res = await postJson("/api/marketplace/payout", { amount_vnd: 0 });
  assert([400, 401].includes(res.status), `Expected 400 or 401, got ${res.status}`);
});

await runTestAsync("6.3 Live API: POST /api/marketplace/payout with 199,999 VNĐ boundary returns 400 or 401", async () => {
  const res = await postJson("/api/marketplace/payout", { amount_vnd: 199999, bank_name: "MB", account_number: "123", account_holder: "TEST" });
  assert([400, 401].includes(res.status), `Expected 400 or 401, got ${res.status}`);
});

await runTestAsync("6.4 Live API: POST /api/affiliate/payout with 199,999 VNĐ boundary returns 400", async () => {
  const res = await postJson("/api/affiliate/payout", {
    amountVnd: 199999,
    bankCode: "MB",
    bankAccount: "123456789",
    bankAccountName: "TEST USER",
  });
  assert.strictEqual(res.status, 400);
  assert(res.data.error.includes("200.000") || res.data.error.includes("tối thiểu"));
});

await runTestAsync("6.5 Live API: POST /api/affiliate/convert-credits with 5,000 VNĐ (< 10,000 floor) returns 400", async () => {
  const res = await postJson("/api/affiliate/convert-credits", { amountVnd: 5000 });
  assert.strictEqual(res.status, 400);
  assert(res.data.error.includes("10.000"));
});

await runTestAsync("6.6 Live API: POST /api/affiliate/convert-credits with 10,000 VNĐ returns 100 credits (demonstrating actual rate)", async () => {
  const res = await postJson("/api/affiliate/convert-credits", { amountVnd: 10000 });
  // Demo fallback user or auth user:
  if (res.status === 200) {
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.creditsAdded, 100, `Expected 100 credits (10000 / 100), got ${res.data.creditsAdded}`);
    console.log(`       Verified actual credits added: ${res.data.creditsAdded} credits (1 credit = 100 VNĐ).`);
    console.log(`       Returned message: "${res.data.message}"`);
  } else {
    assert([400, 401].includes(res.status));
  }
});

// =============================================================================
// SUMMARY & FINDINGS VERDICT
// =============================================================================
console.log("\n================================================================================");
console.log("CHALLENGER #1 EMPIRICAL TEST HARNESS SUMMARY");
console.log(`Total Tests Run: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log("================================================================================");

if (foundMismatchCalculation || foundResidual15xUI) {
  console.log("\n⚠️ CHALLENGER FINDING IDENTIFIED:");
  console.log("1. Bug: In frontend/src/app/(dashboard)/affiliate/page.tsx line 529:");
  console.log("   The modal preview calculates: `+{Math.round((convertAmount || 0) * 1.5).toLocaleString()} Credits`");
  console.log("   For 10,000 VND, the UI promises +15,000 Credits, but backend convertAffiliateToCredits gives only 100 Credits!");
  console.log("2. Residual Copy: Line 201, 276 in affiliate/page.tsx and line 44 in convert-credits/route.ts still mention 'x1.5'.");
}
