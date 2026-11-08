// tests/adversarial/m2_challenger_stress_harness.mjs
// Adversarial Empirical Stress Test Suite for Milestone 2
// PR Group 1: Foundations, Ledger Integrity & Subscription Lifecycle
// Author: Challenger #1 (Empirical Challenger)

import assert from "node:assert/strict";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";

console.log("================================================================================");
console.log("CHALLENGER #1 EMPIRICAL STRESS TEST HARNESS — MILESTONE 2");
console.log("Scope: Subscription Lifecycle, Timing-Safe Cron, PayOS Webhook & Context Hardening");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;
const testResults = [];

function test(name, fn) {
  totalTests++;
  const start = performance.now();
  try {
    fn();
    const duration = (performance.now() - start).toFixed(2);
    passedTests++;
    testResults.push({ name, status: "PASS", duration: `${duration}ms` });
    console.log(`[PASS] ${name} (${duration}ms)`);
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2);
    testResults.push({ name, status: "FAIL", error: err.message, duration: `${duration}ms` });
    console.error(`[FAIL] ${name} (${duration}ms)`);
    console.error(`       Error: ${err.message}`);
  }
}

async function testAsync(name, fn) {
  totalTests++;
  const start = performance.now();
  try {
    await fn();
    const duration = (performance.now() - start).toFixed(2);
    passedTests++;
    testResults.push({ name, status: "PASS", duration: `${duration}ms` });
    console.log(`[PASS] ${name} (${duration}ms)`);
  } catch (err) {
    const duration = (performance.now() - start).toFixed(2);
    testResults.push({ name, status: "FAIL", error: err.message, duration: `${duration}ms` });
    console.error(`[FAIL] ${name} (${duration}ms)`);
    console.error(`       Error: ${err.message}`);
  }
}

// =============================================================================
// DIRECT IMPORT OF PRODUCTION MODULE: plans.ts
// =============================================================================
const plansModule = await import("../../frontend/src/lib/payment/plans.ts");
const {
  isSubscriptionActive,
  isMaxUser,
  isProUser,
  isRealPayingUser,
  getEffectiveTier,
  getTierName,
  PRO_MONTHLY,
  PRO_SEMESTER,
  MAX_MONTHLY,
  MAX_SEMESTER,
  CREDIT_PACKS,
  IS_BETA_ALL_FEATURES_UNLOCKED,
} = plansModule;

// =============================================================================
// SUITE 1: SUBSCRIPTION EXPIRY & TIER LOGIC (plans.ts)
// =============================================================================
console.log("\n================================================================================");
console.log("SUITE 1: SUBSCRIPTION EXPIRY & TIER LOGIC (Direct plans.ts Evaluation)");
console.log("================================================================================");

test("1.1 plans.ts exports are valid and defined", () => {
  assert.equal(typeof isSubscriptionActive, "function");
  assert.equal(typeof isMaxUser, "function");
  assert.equal(typeof isProUser, "function");
  assert.equal(typeof isRealPayingUser, "function");
  assert.equal(typeof getEffectiveTier, "function");
  assert.equal(typeof getTierName, "function");
  assert.equal(IS_BETA_ALL_FEATURES_UNLOCKED, false, "Beta master unlock must be disabled in production");
});

test("1.2 Null, undefined, empty object inputs fail safely to FREE", () => {
  const emptyCases = [null, undefined, {}, { tier: undefined }, { tier: null }];
  for (const c of emptyCases) {
    assert.equal(isSubscriptionActive(c), false, `isSubscriptionActive(${JSON.stringify(c)}) must be false`);
    assert.equal(isMaxUser(c), false, `isMaxUser(${JSON.stringify(c)}) must be false`);
    assert.equal(isProUser(c), false, `isProUser(${JSON.stringify(c)}) must be false`);
    assert.equal(isRealPayingUser(c), false, `isRealPayingUser(${JSON.stringify(c)}) must be false`);
    assert.equal(getEffectiveTier(c), "free", `getEffectiveTier(${JSON.stringify(c)}) must be 'free'`);
    assert.equal(getTierName(c), "GÓI MIỄN PHÍ", `getTierName(${JSON.stringify(c)}) must be 'GÓI MIỄN PHÍ'`);
  }
});

test("1.3 Boundary timestamps on expiration (exact millisecond boundary testing)", () => {
  const now = Date.now();

  // Expired 1 millisecond ago
  const expired1ms = {
    tier: "max",
    subscription_expires_at: new Date(now - 1).toISOString(),
  };
  assert.equal(isSubscriptionActive(expired1ms), false, "1ms expired must return false");
  assert.equal(isMaxUser(expired1ms), false, "1ms expired must not be max");
  assert.equal(isProUser(expired1ms), false, "1ms expired must not be pro");
  assert.equal(getEffectiveTier(expired1ms), "free", "1ms expired effective tier must be free");

  // Active for 1000 milliseconds into future
  const active1s = {
    tier: "max",
    subscription_expires_at: new Date(now + 1000).toISOString(),
  };
  assert.equal(isSubscriptionActive(active1s), true, "1s in future must be active");
  assert.equal(isMaxUser(active1s), true, "1s in future must be max");
  assert.equal(isProUser(active1s), true, "1s in future must be pro");
  assert.equal(getEffectiveTier(active1s), "max", "1s in future effective tier must be max");

  // Active for 30 days
  const active30d = {
    tier: "pro",
    subscription_expires_at: new Date(now + 30 * 86400000).toISOString(),
  };
  assert.equal(isSubscriptionActive(active30d), true);
  assert.equal(isMaxUser(active30d), false);
  assert.equal(isProUser(active30d), true);
  assert.equal(getEffectiveTier(active30d), "pro");
  assert.equal(getTierName(active30d), "GÓI GIÁO VIÊN PRO");
});

test("1.4 Malformed date strings fail safely to inactive", () => {
  const malformedCases = [
    "invalid-date",
    "2026-99-99",
    "null",
    "undefined",
    "NaN",
    "0000-00-00",
  ];
  for (const raw of malformedCases) {
    const profile = { tier: "max", subscription_expires_at: raw };
    assert.equal(isSubscriptionActive(profile), false, `Malformed date '${raw}' must be treated as inactive`);
    assert.equal(isMaxUser(profile), false);
    assert.equal(getEffectiveTier(profile), "free");
  }
});

test("1.5 CamelCase subscriptionExpiresAt property compatibility", () => {
  const now = Date.now();
  const profileCamel = {
    tier: "max",
    subscriptionExpiresAt: new Date(now + 86400000).toISOString(),
  };
  assert.equal(isSubscriptionActive(profileCamel), true, "CamelCase subscriptionExpiresAt must be accepted");
  assert.equal(isMaxUser(profileCamel), true);
});

test("1.6 Free tier accounts with future date never escalate to paid tiers", () => {
  const fakeFutureFree = {
    tier: "free",
    subscription_expires_at: new Date(Date.now() + 86400000 * 365).toISOString(),
  };
  assert.equal(isMaxUser(fakeFutureFree), false, "Free tier must never be MAX");
  assert.equal(isProUser(fakeFutureFree), false, "Free tier must never be PRO");
  assert.equal(isRealPayingUser(fakeFutureFree), false, "Free tier must never be real paying user");
  assert.equal(getEffectiveTier(fakeFutureFree), "free", "Effective tier must strictly be free");
});

test("1.7 School institutional license without expiration bypasses expiry check", () => {
  const schoolProfile = {
    id: "school-license-001",
    tier: "school",
    subscription_expires_at: null,
  };
  assert.equal(isSubscriptionActive(schoolProfile), true, "School without expiry is institutional lifetime");
  assert.equal(isMaxUser(schoolProfile), true, "School license has MAX privileges");
  assert.equal(isProUser(schoolProfile), true, "School license has PRO privileges");
  assert.equal(getEffectiveTier(schoolProfile), "school", "Effective tier is school");
  assert.equal(getTierName(schoolProfile), "GÓI LUYỆN THI MAX VIP");
});

test("1.8 School institutional license with expired contract date expires properly", () => {
  const schoolExpired = {
    id: "school-license-expired",
    tier: "school",
    subscription_expires_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  };
  assert.equal(isSubscriptionActive(schoolExpired), false, "Contract with past expiry must expire");
  assert.equal(isMaxUser(schoolExpired), false, "Expired school license must NOT be MAX");
  assert.equal(isProUser(schoolExpired), false, "Expired school license must NOT be PRO");
  assert.equal(getEffectiveTier(schoolExpired), "free", "Expired school license degrades to free");
});

test("1.9 Master Admin account bypasses expiry check unconditionally", () => {
  const masterAdmin = {
    id: "84493d6a-4eff-42af-bf7d-0da914f96e39",
    email: "truongcri0101@gmail.com",
    tier: "free",
    subscription_expires_at: new Date(Date.now() - 86400000 * 500).toISOString(),
  };
  assert.equal(isMaxUser(masterAdmin), true, "Master Admin always has MAX");
  assert.equal(isProUser(masterAdmin), true, "Master Admin always has PRO");
  assert.equal(isRealPayingUser(masterAdmin), true);
  assert.equal(getTierName(masterAdmin), "GÓI LUYỆN THI MAX VIP");
});

test("1.10 Tampered client preferences or user_metadata does not escalate tier (RC-03)", () => {
  const attackVectors = [
    {
      id: "atk-1",
      email: "victim@domain.vn",
      tier: "free",
      preferences: { subscription_tier: "max", tier: "max", is_vip: true },
    },
    {
      id: "atk-2",
      email: "victim2@domain.vn",
      tier: "free",
      user_metadata: { tier: "max", subscription_tier: "max", role: "admin" },
    },
    {
      id: "atk-3",
      email: "attacker@domain.vn",
      tier: "free",
      user_metadata: { email: "truongcri0101@gmail.com" }, // Email spoofing via metadata
      preferences: { tier: "school" },
    },
  ];

  for (const atk of attackVectors) {
    assert.equal(isMaxUser(atk), false, `Attack vector ${atk.id} must NOT escalate to max`);
    assert.equal(isProUser(atk), false, `Attack vector ${atk.id} must NOT escalate to pro`);
    assert.equal(getEffectiveTier(atk), "free", `Attack vector ${atk.id} must be effective free`);
  }
});

test("1.11 Pricing catalog constants conform to business specifications", () => {
  assert.equal(PRO_MONTHLY.amount, 149000);
  assert.equal(PRO_MONTHLY.tier, "pro");
  assert.equal(PRO_MONTHLY.credits, 30000);

  assert.equal(PRO_SEMESTER.amount, 599000);
  assert.equal(PRO_SEMESTER.tier, "pro");
  assert.equal(PRO_SEMESTER.credits, 150000);

  assert.equal(MAX_MONTHLY.amount, 229000);
  assert.equal(MAX_MONTHLY.tier, "max");
  assert.equal(MAX_MONTHLY.credits, 100000);

  assert.equal(MAX_SEMESTER.amount, 899000);
  assert.equal(MAX_SEMESTER.tier, "max");
  assert.equal(MAX_SEMESTER.credits, 500000);
});

// =============================================================================
// SUITE 2: TIMING-SAFE & CRON ROUTE SECURITY (cron/subscriptions/route.ts)
// =============================================================================
console.log("\n================================================================================");
console.log("SUITE 2: TIMING-SAFE CRON ROUTE SECURITY & DOWNGRADE RPC VERIFICATION");
console.log("================================================================================");

// Emulate verifyCronAuth algorithm from frontend/src/app/api/cron/subscriptions/route.ts:11-35
function verifyCronAuth(authHeader, cronSecret) {
  if (!cronSecret) {
    return { authorized: false, reason: "CRON_SECRET is not configured on the server.", status: 500 };
  }

  if (!authHeader) {
    return { authorized: false, reason: "Missing Authorization header.", status: 401 };
  }

  const expected = `Bearer ${cronSecret}`;
  const authBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expected);

  if (authBuffer.length !== expectedBuffer.length) {
    return { authorized: false, reason: "Invalid authorization token.", status: 401 };
  }

  if (!crypto.timingSafeEqual(authBuffer, expectedBuffer)) {
    return { authorized: false, reason: "Invalid authorization token.", status: 401 };
  }

  return { authorized: true, status: 200 };
}

test("2.1 Missing Authorization header yields 401", () => {
  const result = verifyCronAuth(null, "production_cron_secret_abc123");
  assert.equal(result.authorized, false);
  assert.equal(result.status, 401);
  assert.equal(result.reason, "Missing Authorization header.");
});

test("2.2 Incorrect Authorization schemes yield 401", () => {
  const invalidHeaders = [
    "Basic production_cron_secret_abc123",
    "bearer production_cron_secret_abc123", // lowercase bearer
    "Token production_cron_secret_abc123",
    "production_cron_secret_abc123",
    "Bearer",
    "Bearer ",
  ];
  for (const h of invalidHeaders) {
    const res = verifyCronAuth(h, "production_cron_secret_abc123");
    assert.equal(res.authorized, false, `Header '${h}' must not be authorized`);
    assert.equal(res.status, 401);
  }
});

test("2.3 Wrong token with identical length is rejected via timingSafeEqual", () => {
  const secret = "production_cron_secret_abc123";
  const wrongToken = "production_cron_secret_abc124"; // last char diff
  const header = `Bearer ${wrongToken}`;
  const res = verifyCronAuth(header, secret);
  assert.equal(res.authorized, false);
  assert.equal(res.status, 401);
  assert.equal(res.reason, "Invalid authorization token.");
});

test("2.4 Wrong token with different length is rejected early without throwing", () => {
  const secret = "production_cron_secret_abc123";
  const wrongToken = "short_token";
  const header = `Bearer ${wrongToken}`;
  const res = verifyCronAuth(header, secret);
  assert.equal(res.authorized, false);
  assert.equal(res.status, 401);
});

test("2.5 Unconfigured CRON_SECRET returns 500 error to prevent accidental open access", () => {
  const unconfiguredCases = [null, undefined, ""];
  for (const unset of unconfiguredCases) {
    const res = verifyCronAuth("Bearer any_token", unset);
    assert.equal(res.authorized, false);
    assert.equal(res.status, 500);
    assert.match(res.reason, /CRON_SECRET is not configured/);
  }
});

test("2.6 Valid Bearer token succeeds with 200", () => {
  const secret = "edteach_v2_super_secure_cron_secret_998877";
  const header = `Bearer ${secret}`;
  const res = verifyCronAuth(header, secret);
  assert.equal(res.authorized, true);
  assert.equal(res.status, 200);
});

test("2.7 Timing-safe invariance: Equal execution distribution across byte offsets", () => {
  const secret = "A".repeat(64);
  const correctHeader = `Bearer ${secret}`;
  const totalRounds = 5000;

  // Measure time when first char differs vs when last char differs
  const mismatchFirst = `Bearer ${"B" + "A".repeat(63)}`;
  const mismatchLast = `Bearer ${"A".repeat(63) + "B"}`;

  const startFirst = performance.now();
  for (let i = 0; i < totalRounds; i++) {
    verifyCronAuth(mismatchFirst, secret);
  }
  const timeFirst = performance.now() - startFirst;

  const startLast = performance.now();
  for (let i = 0; i < totalRounds; i++) {
    verifyCronAuth(mismatchLast, secret);
  }
  const timeLast = performance.now() - startLast;

  // The ratio of execution times should be close (within noise margin < 3x)
  const ratio = Math.max(timeFirst, timeLast) / Math.min(timeFirst, timeLast);
  assert.ok(ratio < 3.0, `TimingSafeEqual time ratio must be close: ${ratio.toFixed(2)}`);
});

test("2.8 SQL downgrade procedure structure in 20261110_subscription_lifecycle.sql", () => {
  const sqlPath = path.resolve("supabase/migrations/20261110_subscription_lifecycle.sql");
  assert.ok(fs.existsSync(sqlPath), "Migration file must exist");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.downgrade_expired_subscriptions\(\)/);
  assert.match(sql, /idx_users_subscription_expiry/);
  assert.match(sql, /WHERE subscription_expires_at IS NOT NULL/);
  assert.match(sql, /AND subscription_expires_at <= NOW\(\)/);
  assert.match(sql, /AND tier <> 'free'/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.downgrade_expired_subscriptions\(\) FROM PUBLIC/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.downgrade_expired_subscriptions\(\) TO service_role/);
});

// =============================================================================
// SUITE 3: PAYOS WEBHOOK RENEWAL STACKING & FRAUD IMMUNITY (route.ts)
// =============================================================================
console.log("\n================================================================================");
console.log("SUITE 3: PAYOS WEBHOOK RENEWAL STACKING & UNDERPAYMENT PROTECTION");
console.log("================================================================================");

// Emulate expiration calculation logic from frontend/src/app/api/payment/webhook/payos/route.ts:125-141
function calculateExpirationDate(currentUserExpiryStr, daysToAdd, mockNow = Date.now()) {
  const currentExpiresAt = currentUserExpiryStr ? new Date(currentUserExpiryStr).getTime() : 0;
  const baseTimestamp = currentExpiresAt > mockNow ? currentExpiresAt : mockNow;
  return new Date(baseTimestamp + daysToAdd * 24 * 3600 * 1000).toISOString();
}

// Emulate Tier & Days decision from frontend/src/app/api/payment/webhook/payos/route.ts:126-177
function determineWebhookTierUpgrade(paidAmount) {
  const isSemester = paidAmount === 899000 || paidAmount === 599000;
  const daysToAdd = isSemester ? 150 : 30;

  let newTier = null;
  if (paidAmount === 229000 || paidAmount === 899000) {
    newTier = "max";
  } else if (paidAmount === 149000 || paidAmount === 599000 || paidAmount === 99000) {
    newTier = "pro";
  }

  return { newTier, daysToAdd, isSemester };
}

test("3.1 Early renewal with remaining days stacks onto existing expiration date", () => {
  const now = Date.now();
  const remainingDays = 14;
  const currentExpiry = new Date(now + remainingDays * 86400000).toISOString();

  // Renew for 30 days
  const updatedIso = calculateExpirationDate(currentExpiry, 30, now);
  const updatedTimestamp = new Date(updatedIso).getTime();
  const expectedTimestamp = new Date(currentExpiry).getTime() + 30 * 86400000;

  assert.equal(updatedTimestamp, expectedTimestamp, "Must stack remaining 14 days + 30 days = 44 days");
});

test("3.2 Semester renewal (150 days) stacks onto existing remaining period", () => {
  const now = Date.now();
  const remainingDays = 60;
  const currentExpiry = new Date(now + remainingDays * 86400000).toISOString();

  // Renew for 150 days (semester)
  const updatedIso = calculateExpirationDate(currentExpiry, 150, now);
  const updatedTimestamp = new Date(updatedIso).getTime();
  const expectedTimestamp = new Date(currentExpiry).getTime() + 150 * 86400000;

  assert.equal(updatedTimestamp, expectedTimestamp, "Must stack 60 days + 150 days = 210 days");
});

test("3.3 Expired subscription renews fresh starting from current timestamp", () => {
  const now = Date.now();
  const pastDays = 15;
  const expiredDate = new Date(now - pastDays * 86400000).toISOString(); // Expired 15 days ago

  const updatedIso = calculateExpirationDate(expiredDate, 30, now);
  const updatedTimestamp = new Date(updatedIso).getTime();
  const expectedTimestamp = now + 30 * 86400000;

  assert.equal(updatedTimestamp, expectedTimestamp, "Expired user starts fresh from now + 30 days");
});

test("3.4 Brand new subscriber with null expiration starts from current timestamp", () => {
  const now = Date.now();
  const updatedIso = calculateExpirationDate(null, 30, now);
  const updatedTimestamp = new Date(updatedIso).getTime();
  const expectedTimestamp = now + 30 * 86400000;

  assert.equal(updatedTimestamp, expectedTimestamp, "Null expiry starts from now + 30 days");
});

test("3.5 PRC-02 Security: Bank transfer memo containing MAX/PRO is ignored if underpaid", () => {
  const underpaidAttacks = [
    { amount: 1000, desc: "UPGRADE TO MAX VIP" },
    { amount: 10000, desc: "MAX_SEMESTER" },
    { amount: 49000, desc: "GOI MAX LUYEN THI VIP" }, // 49k credit pack
    { amount: 89000, desc: "PRO_MONTHLY 100 CREDITS" }, // 89k credit pack
    { amount: 159000, desc: "MAX" }, // 159k credit pack
    { amount: 200000, desc: "PRO" },
  ];

  for (const atk of underpaidAttacks) {
    const { newTier } = determineWebhookTierUpgrade(atk.amount);
    assert.equal(
      newTier,
      null,
      `Underpaid amount ${atk.amount}đ with memo '${atk.desc}' must NEVER grant paid tiers!`
    );
  }
});

test("3.6 Legitimate payments grant exact corresponding tiers and durations", () => {
  const legitPayments = [
    { amount: 99000, expectedTier: "pro", expectedDays: 30 },
    { amount: 149000, expectedTier: "pro", expectedDays: 30 },
    { amount: 599000, expectedTier: "pro", expectedDays: 150 },
    { amount: 229000, expectedTier: "max", expectedDays: 30 },
    { amount: 899000, expectedTier: "max", expectedDays: 150 },
  ];

  for (const legit of legitPayments) {
    const { newTier, daysToAdd } = determineWebhookTierUpgrade(legit.amount);
    assert.equal(newTier, legit.expectedTier, `Amount ${legit.amount} must grant tier ${legit.expectedTier}`);
    assert.equal(daysToAdd, legit.expectedDays, `Amount ${legit.amount} must grant ${legit.expectedDays} days`);
  }
});

test("3.7 Verification of webhook source code: No description string matching in executable logic", () => {
  const webhookSrcPath = path.resolve("frontend/src/app/api/payment/webhook/payos/route.ts");
  const rawCode = fs.readFileSync(webhookSrcPath, "utf-8");
  const codeWithoutComments = rawCode.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  assert.ok(
    !codeWithoutComments.includes("description?.includes"),
    "Executable logic must NOT include description?.includes"
  );
  assert.ok(
    !codeWithoutComments.includes("description.includes"),
    "Executable logic must NOT include description.includes"
  );
  assert.match(rawCode, /currentExpiresAt > now \? currentExpiresAt : now/, "Must stack remaining days");
});

// =============================================================================
// SUITE 4: CLIENT CONTEXT HARDENING & SESSION DETAIL GATING
// =============================================================================
console.log("\n================================================================================");
console.log("SUITE 4: CLIENT CONTEXT HARDENING & COMPONENT ACCESS CONTROLS");
console.log("================================================================================");

test("4.1 auth-context.tsx does not elevate tier based on user_metadata or client storage", () => {
  const authContextPath = path.resolve("frontend/src/context/auth-context.tsx");
  const code = fs.readFileSync(authContextPath, "utf-8");

  assert.ok(!code.includes("user_metadata?.tier"), "auth-context must NOT read tier from user_metadata");
  assert.ok(!code.includes("meta?.tier"), "auth-context must NOT read tier from meta?.tier");
  assert.match(
    code,
    /\.from\s*\(\s*["']users["']\s*\)\s*\.select\s*\(\s*["']\*["']\s*\)\s*\.eq\s*\(\s*["']id["']\s*,\s*userId\s*\)/,
    "auth-context must read profile from database table 'users'"
  );
});

test("4.2 session-detail-view.tsx gates Whiteboard and Zalo Note features behind isMaxUser", () => {
  const viewPath = path.resolve("frontend/src/components/grading/session-detail-view.tsx");
  const code = fs.readFileSync(viewPath, "utf-8");

  // Check imports
  assert.match(code, /import\s*\{[^}]*isMaxUser[^}]*\}\s*from\s*["']@\/lib\/payment\/plans["']/);

  // Check Whiteboard gating
  assert.match(code, /handlePushToTeachingWhiteboard\s*=\s*\(\)\s*=>\s*\{\s*if\s*\(!isMaxUser\(profile\)\)/);

  // Check Zalo Note gating
  assert.match(code, /handleGenerateZaloNote\s*=\s*\(student:\s*GradedStudent\)\s*=>\s*\{\s*if\s*\(!isMaxUser\(profile\)\)/);
});

test("4.3 Component simulation: Expired MAX user denied Whiteboard push and Zalo note", () => {
  const expiredMaxProfile = {
    id: "user-exp-1",
    email: "teacher@school.vn",
    tier: "max",
    subscription_expires_at: new Date(Date.now() - 3600000).toISOString(),
  };

  // Simulation of handlePushToTeachingWhiteboard check
  const canPushWhiteboard = isMaxUser(expiredMaxProfile);
  assert.equal(canPushWhiteboard, false, "Expired MAX user must be denied whiteboard push");

  // Simulation of handleGenerateZaloNote check
  const canGenerateZalo = isMaxUser(expiredMaxProfile);
  assert.equal(canGenerateZalo, false, "Expired MAX user must be denied Zalo note generation");
});

test("4.4 Component simulation: Active MAX user granted Whiteboard push and Zalo note", () => {
  const activeMaxProfile = {
    id: "user-act-1",
    email: "teacher_vip@school.vn",
    tier: "max",
    subscription_expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
  };

  assert.equal(isMaxUser(activeMaxProfile), true, "Active MAX user must be permitted whiteboard push");
  assert.equal(isProUser(activeMaxProfile), true, "Active MAX user must be permitted pro features");
});

// =============================================================================
// SUITE 5: CANONICAL DOMAINS & SYSTEM INTEGRITY CHECKS (PR 1.1)
// =============================================================================
console.log("\n================================================================================");
console.log("SUITE 5: CONSTANTS, CANONICAL DOMAIN & WITHDRAWAL THRESHOLD INTEGRITY");
console.log("================================================================================");

test("5.1 lib/constants.ts defines standard system values", async () => {
  const constantsModule = await import("../../frontend/src/lib/constants.ts");
  const {
    DEFAULT_APP_URL,
    APP_URL,
    getBaseUrl,
    MINIMUM_PAYOUT_VND,
    SUPPORT_EMAIL,
    REFERRAL_BONUS_CREDITS,
    PLATFORM_NAME,
  } = constantsModule;

  assert.equal(DEFAULT_APP_URL, "https://ed-teach-rust.vercel.app");
  assert.ok(APP_URL.startsWith("http"));
  assert.equal(MINIMUM_PAYOUT_VND, 200000, "Minimum payout must be 200.000 VNĐ");
  assert.equal(SUPPORT_EMAIL, "developerhoangtruong@gmail.com");
  assert.equal(REFERRAL_BONUS_CREDITS, 2000, "Referral reward must be 2.000 credits");
  assert.equal(PLATFORM_NAME, "EduTest");

  // Test getBaseUrl helper with request mock
  const mockReqHeaders = new Headers({
    "x-forwarded-proto": "https",
    "x-forwarded-host": "edutest.ai",
  });
  const mockReq = { headers: mockReqHeaders };
  assert.equal(getBaseUrl(mockReq), "https://edutest.ai");
});

test("5.2 Zero occurrences of localhost:3000 or localhost:3001 in app/api", () => {
  const apiDir = path.resolve("frontend/src/app/api");
  const findMatches = (dir) => {
    let matches = [];
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      const fullPath = path.join(dir, f.name);
      if (f.isDirectory()) {
        matches = matches.concat(findMatches(fullPath));
      } else if (f.name.endsWith(".ts") || f.name.endsWith(".tsx")) {
        const content = fs.readFileSync(fullPath, "utf-8");
        if (content.includes("localhost:3000") || content.includes("localhost:3001")) {
          matches.push(fullPath);
        }
      }
    }
    return matches;
  };

  const leaks = findMatches(apiDir);
  assert.equal(leaks.length, 0, `Found hardcoded localhost in api routes: ${JSON.stringify(leaks)}`);
});

// =============================================================================
// SUITE 6: HIGH-THROUGHPUT FUZZING & ADVERSARIAL GENERATOR HARNESS
// =============================================================================
console.log("\n================================================================================");
console.log("SUITE 6: HIGH-THROUGHPUT FUZZING & GENERATOR STRESS TESTING");
console.log("================================================================================");

test("6.1 Random Fuzzing Generator: 10,000 randomized profiles against plans.ts", () => {
  const tiers = ["free", "pro", "max", "school", "unknown", null, undefined, 123, true, {}];
  const dates = [
    null,
    undefined,
    "",
    "invalid",
    new Date(Date.now() - 100000).toISOString(),
    new Date(Date.now() + 100000).toISOString(),
    "1970-01-01T00:00:00.000Z",
    "2099-12-31T23:59:59.999Z",
    0,
    -1,
    NaN,
    Date.now() + 50000,
  ];

  let activeCount = 0;
  let maxCount = 0;
  let proCount = 0;

  for (let i = 0; i < 10000; i++) {
    const tier = tiers[i % tiers.length];
    const exp = dates[(i * 7) % dates.length];
    const profile = {
      id: `fuzz-${i}`,
      email: `user${i}@domain.com`,
      tier,
      subscription_expires_at: exp,
    };

    // None of these calls should ever throw
    const active = isSubscriptionActive(profile);
    const max = isMaxUser(profile);
    const pro = isProUser(profile);
    const paying = isRealPayingUser(profile);
    const effective = getEffectiveTier(profile);
    const name = getTierName(profile);

    assert.ok(typeof active === "boolean");
    assert.ok(typeof max === "boolean");
    assert.ok(typeof pro === "boolean");
    assert.ok(typeof paying === "boolean");
    assert.ok(["free", "pro", "max", "school"].includes(effective));
    assert.ok(typeof name === "string");

    if (active) activeCount++;
    if (max) maxCount++;
    if (pro) proCount++;
  }

  assert.ok(activeCount > 0, "Fuzzer must produce valid active profiles");
});

test("6.2 Authorization Header Fuzzing: 2,000 malformed inputs against timingSafeEqual", () => {
  const secret = "fuzz_secret_token_alpha_numeric_987654";
  const garbageHeaders = [
    "",
    " ",
    "\t",
    "\n",
    "\0",
    "Bearer\0",
    "Bearer \0",
    "Bearer " + "\0".repeat(32),
    "Bearer " + "a".repeat(1000),
    "Bearer " + secret.slice(0, 10),
    "Bearer " + secret + "_extra",
    "BEARER " + secret,
    "bearer " + secret,
    "Bearer " + secret.toUpperCase(),
    "Bearer " + secret.replace("a", "b"),
  ];

  for (const h of garbageHeaders) {
    const res = verifyCronAuth(h, secret);
    assert.equal(res.authorized, false, `Garbage header '${h}' must not be authorized`);
    assert.equal(res.status, 401);
  }

  // Generate 2,000 random strings of matching length
  const targetLen = `Bearer ${secret}`.length;
  for (let i = 0; i < 2000; i++) {
    const randomChars = crypto.randomBytes(targetLen).toString("latin1");
    if (randomChars === `Bearer ${secret}`) continue;
    const res = verifyCronAuth(randomChars, secret);
    assert.equal(res.authorized, false);
    assert.equal(res.status, 401);
  }
});

test("6.3 Webhook Stacking Invariance: Continuous renewal monotonicity", () => {
  // Test stacking 12 consecutive renewals of 30 days
  let currentExpiry = new Date().toISOString();
  let accumulatedDays = 0;
  const initialTime = new Date(currentExpiry).getTime();

  for (let cycle = 1; cycle <= 12; cycle++) {
    accumulatedDays += 30;
    currentExpiry = calculateExpirationDate(currentExpiry, 30, initialTime);
    const expectedTime = initialTime + accumulatedDays * 86400000;
    assert.equal(
      new Date(currentExpiry).getTime(),
      expectedTime,
      `Cycle ${cycle} stacked time must be monotonic and accurate`
    );
  }
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log("\n================================================================================");
console.log(`STRESS HARNESS RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
console.log("================================================================================");

if (testResults.some((r) => r.status === "FAIL")) {
  console.error("FAILURES DETECTED IN CHALLENGER TEST SUITE:");
  for (const r of testResults.filter((r) => r.status === "FAIL")) {
    console.error(`- ${r.name}: ${r.error}`);
  }
  process.exit(1);
} else {
  console.log("ALL ADVERSARIAL STRESS TESTS PASSED WITH 100% EMPIRICAL CONFIRMATION!\n");
}
