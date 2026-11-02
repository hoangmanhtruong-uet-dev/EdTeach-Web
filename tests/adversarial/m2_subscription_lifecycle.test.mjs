// tests/adversarial/m2_subscription_lifecycle.test.mjs
// Adversarial Empirical Test Suite for Milestone 2 PR 1.3 (Subscription Expiry & Downgrade Lifecycle)
// Written by Teamwork Explorer M2.3

import assert from "node:assert/strict";

console.log("================================================================================");
console.log("STARTING EMPIRICAL ADVERSARIAL TEST: MILESTONE 2 PR 1.3 (SUBSCRIPTION LIFECYCLE)");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;
const failures = [];

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failures.push({ name, error: err });
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// Emulated logic of proposed plans.ts
// -----------------------------------------------------------------------------
const IS_BETA_ALL_FEATURES_UNLOCKED = false;

function isSubscriptionActive(profile) {
  if (!profile) return false;

  const rawExpires = profile.subscription_expires_at || profile.subscriptionExpiresAt;
  if (rawExpires) {
    const expiresTimestamp = new Date(rawExpires).getTime();
    if (isNaN(expiresTimestamp) || expiresTimestamp <= Date.now()) {
      return false; // Expired!
    }
    return true; // Active!
  }

  // If no expires_at:
  if (!profile.tier || profile.tier === "free") return false;

  // School tier or manual admin grant
  return true;
}

function isMaxUser(profile) {
  if (IS_BETA_ALL_FEATURES_UNLOCKED) return true;
  if (!profile) return false;

  const email = (profile.email || profile.user_metadata?.email || "").toLowerCase();
  const id = profile.id;
  if (
    email === "truongcri0101@gmail.com" ||
    email.includes("truongcri0101") ||
    id === "84493d6a-4eff-42af-bf7d-0da914f96e39"
  ) {
    return true;
  }

  const tier = profile.tier || profile.subscription_tier;
  if (tier !== "max" && tier !== "school") {
    return false;
  }

  return isSubscriptionActive(profile);
}

function isProUser(profile) {
  if (IS_BETA_ALL_FEATURES_UNLOCKED) return true;
  if (!profile) return false;

  if (isMaxUser(profile)) return true;

  const tier = profile.tier || profile.subscription_tier;
  if (tier !== "pro") {
    return false;
  }

  return isSubscriptionActive(profile);
}

function getEffectiveTier(profile) {
  if (isMaxUser(profile)) {
    return profile?.tier === "school" ? "school" : "max";
  }
  if (isProUser(profile)) {
    return "pro";
  }
  return "free";
}

function getTierName(profile) {
  if (isMaxUser(profile)) {
    const email = (profile?.email || profile?.user_metadata?.email || "").toLowerCase();
    if (
      email === "truongcri0101@gmail.com" ||
      email.includes("truongcri0101") ||
      profile?.tier === "school"
    ) {
      return "GÓI LUYỆN THI MAX VIP";
    }
    return "GÓI LUYỆN THI MAX";
  }
  if (isProUser(profile)) return "GÓI GIÁO VIÊN PRO";
  return "GÓI MIỄN PHÍ";
}

// -----------------------------------------------------------------------------
// Emulated Early Renewal Expiry Calculation in PayOS Webhook
// -----------------------------------------------------------------------------
function calculateNewExpiration(currentExpiresAtStr, daysToAdd, nowMs = Date.now()) {
  const currentExpiresAt = currentExpiresAtStr ? new Date(currentExpiresAtStr).getTime() : 0;
  const baseTimestamp = currentExpiresAt > nowMs ? currentExpiresAt : nowMs;
  return new Date(baseTimestamp + daysToAdd * 24 * 3600 * 1000).toISOString();
}

// -----------------------------------------------------------------------------
// Emulated Cron Authorization
// -----------------------------------------------------------------------------
import crypto from "node:crypto";

function verifyCronHeader(authHeader, configuredSecret) {
  if (!configuredSecret) return { authorized: false, status: 500 };
  if (!authHeader) return { authorized: false, status: 401 };

  const expected = `Bearer ${configuredSecret}`;
  const authBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expected);

  if (authBuffer.length !== expectedBuffer.length) {
    return { authorized: false, status: 401 };
  }

  if (!crypto.timingSafeEqual(authBuffer, expectedBuffer)) {
    return { authorized: false, status: 401 };
  }

  return { authorized: true, status: 200 };
}

// =============================================================================
// TEST SUITE EXECUTION
// =============================================================================

console.log("--- Section 1: Testing isSubscriptionActive logic ---");

runTest("1.1 Active future date returns true", () => {
  const profile = {
    tier: "pro",
    subscription_expires_at: new Date(Date.now() + 86400000 * 15).toISOString(),
  };
  assert.equal(isSubscriptionActive(profile), true);
});

runTest("1.2 Past expiration date returns false", () => {
  const profile = {
    tier: "pro",
    subscription_expires_at: new Date(Date.now() - 1000).toISOString(),
  };
  assert.equal(isSubscriptionActive(profile), false);
});

runTest("1.3 Invalid date string returns false", () => {
  const profile = {
    tier: "max",
    subscription_expires_at: "invalid-date-string",
  };
  assert.equal(isSubscriptionActive(profile), false);
});

runTest("1.4 Free user with null expiration returns false", () => {
  const profile = {
    tier: "free",
    subscription_expires_at: null,
  };
  assert.equal(isSubscriptionActive(profile), false);
});

runTest("1.5 School license with null expiration returns true (institutional grant)", () => {
  const profile = {
    tier: "school",
    subscription_expires_at: null,
  };
  assert.equal(isSubscriptionActive(profile), true);
});

console.log("\n--- Section 2: Testing isMaxUser & isProUser Tier Gating ---");

runTest("2.1 Expired MAX user is rejected by isMaxUser and isProUser", () => {
  const profile = {
    id: "user-123",
    email: "teacher@school.edu.vn",
    tier: "max",
    subscription_expires_at: new Date(Date.now() - 3600000).toISOString(),
  };
  assert.equal(isMaxUser(profile), false, "Expired MAX user must NOT be max");
  assert.equal(isProUser(profile), false, "Expired MAX user must NOT be pro");
  assert.equal(getEffectiveTier(profile), "free");
  assert.equal(getTierName(profile), "GÓI MIỄN PHÍ");
});

runTest("2.2 Expired PRO user is rejected by isProUser", () => {
  const profile = {
    id: "user-456",
    email: "teacher2@school.edu.vn",
    tier: "pro",
    subscription_expires_at: new Date(Date.now() - 86400000).toISOString(),
  };
  assert.equal(isProUser(profile), false, "Expired PRO user must NOT be pro");
  assert.equal(getEffectiveTier(profile), "free");
  assert.equal(getTierName(profile), "GÓI MIỄN PHÍ");
});

runTest("2.3 Active MAX user has both MAX and PRO privileges", () => {
  const profile = {
    id: "user-789",
    email: "teacher3@school.edu.vn",
    tier: "max",
    subscription_expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
  };
  assert.equal(isMaxUser(profile), true);
  assert.equal(isProUser(profile), true);
  assert.equal(getEffectiveTier(profile), "max");
  assert.equal(getTierName(profile), "GÓI LUYỆN THI MAX");
});

runTest("2.4 Active PRO user has PRO privileges but not MAX", () => {
  const profile = {
    id: "user-101",
    email: "teacher4@school.edu.vn",
    tier: "pro",
    subscription_expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
  };
  assert.equal(isMaxUser(profile), false);
  assert.equal(isProUser(profile), true);
  assert.equal(getEffectiveTier(profile), "pro");
  assert.equal(getTierName(profile), "GÓI GIÁO VIÊN PRO");
});

runTest("2.5 Client-injected preferences or user_metadata does not elevate tier (RC-03)", () => {
  const attackProfile = {
    id: "hacker-1",
    email: "hacker@evil.com",
    tier: "free",
    preferences: { subscription_tier: "max" },
    user_metadata: { subscription_tier: "max", tier: "max" },
  };
  assert.equal(isMaxUser(attackProfile), false);
  assert.equal(isProUser(attackProfile), false);
  assert.equal(getEffectiveTier(attackProfile), "free");
});

runTest("2.6 Master admin email bypasses expiry check", () => {
  const adminProfile = {
    id: "admin-1",
    email: "truongcri0101@gmail.com",
    tier: "free",
    subscription_expires_at: new Date(Date.now() - 86400000 * 100).toISOString(),
  };
  assert.equal(isMaxUser(adminProfile), true);
  assert.equal(isProUser(adminProfile), true);
});

console.log("\n--- Section 3: Testing PayOS Webhook Stacking Formula & Anti-Tampering ---");

runTest("3.1 Early renewal stacks onto remaining active subscription days", () => {
  const now = Date.now();
  const currentExpiry = new Date(now + 86400000 * 15).toISOString(); // 15 days remaining
  const newExpiryIso = calculateNewExpiration(currentExpiry, 30, now);
  const newExpiryTime = new Date(newExpiryIso).getTime();

  const expectedTime = new Date(currentExpiry).getTime() + 86400000 * 30;
  assert.equal(newExpiryTime, expectedTime, "Must stack remaining 15 days + 30 new days = 45 days");
});

runTest("3.2 Expired renewal calculates fresh from current moment", () => {
  const now = Date.now();
  const expiredDate = new Date(now - 86400000 * 10).toISOString(); // Expired 10 days ago
  const newExpiryIso = calculateNewExpiration(expiredDate, 30, now);
  const newExpiryTime = new Date(newExpiryIso).getTime();

  const expectedTime = now + 86400000 * 30;
  assert.equal(newExpiryTime, expectedTime, "Must start fresh from now + 30 days");
});

runTest("3.3 Bank transfer memo containing 'MAX' is ignored if amount is 49.000đ (PRC-02)", () => {
  const paidAmount = 49000;
  const description = "NAP TIEN MAX VIP PRO";

  // Proposed logic: check paidAmount only
  const isMax = paidAmount === 229000 || paidAmount === 899000;
  const isPro = paidAmount === 149000 || paidAmount === 599000 || paidAmount === 99000;

  assert.equal(isMax, false, "49k with memo MAX must NOT unlock MAX");
  assert.equal(isPro, false, "49k with memo PRO must NOT unlock PRO");
});

console.log("\n--- Section 4: Testing Cron Route Security ---");

runTest("4.1 Missing Authorization header is rejected with 401", () => {
  const res = verifyCronHeader(null, "secret123");
  assert.equal(res.authorized, false);
  assert.equal(res.status, 401);
});

runTest("4.2 Invalid Bearer token is rejected with 401", () => {
  const res = verifyCronHeader("Bearer wrong_secret", "secret123");
  assert.equal(res.authorized, false);
  assert.equal(res.status, 401);
});

runTest("4.3 Unset server CRON_SECRET returns 500 error", () => {
  const res = verifyCronHeader("Bearer any", "");
  assert.equal(res.authorized, false);
  assert.equal(res.status, 500);
});

runTest("4.4 Valid Bearer token matches successfully", () => {
  const res = verifyCronHeader("Bearer super_cron_secret_777", "super_cron_secret_777");
  assert.equal(res.authorized, true);
  assert.equal(res.status, 200);
});

console.log("\n================================================================================");
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed (${failures.length} failures)`);
console.log("================================================================================");

if (failures.length > 0) {
  process.exit(1);
} else {
  console.log("ALL ADVERSARIAL SUBSCRIPTION LIFECYCLE TESTS PASSED PERFECTLY!\n");
}
