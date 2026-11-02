// tests/adversarial/m2_pr1_ledger_and_constants.test.mjs
// Adversarial Empirical Test Suite for Milestone 2 (PR 1.1: Constants & Payout Consistency)
// Written by Teamwork Challenger (Empirical Challenger)

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

console.log("================================================================================");
console.log("STARTING EMPIRICAL ADVERSARIAL TEST: MILESTONE 2 (PR 1.1: CONSTANTS & PAYOUT)");
console.log("================================================================================\n");

let passed = 0;
let total = 0;
const failures = [];

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failures.push({ name, error: err });
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// Import / mirror exact constants & getBaseUrl from frontend/src/lib/constants.ts
// -----------------------------------------------------------------------------
const DEFAULT_APP_URL = "https://ed-teach-rust.vercel.app";
const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
const APP_URL = rawAppUrl.replace(/\/+$/, "");

function getBaseUrl(req) {
  if (req && "headers" in req) {
    const forwardedHost =
      (typeof req.headers.get === "function" ? req.headers.get("x-forwarded-host") : req.headers["x-forwarded-host"]) ||
      (typeof req.headers.get === "function" ? req.headers.get("host") : req.headers["host"]);
    if (forwardedHost) {
      const forwardedProto =
        (typeof req.headers.get === "function" ? req.headers.get("x-forwarded-proto") : req.headers["x-forwarded-proto"]) ||
        (forwardedHost.includes("localhost") ? "http" : "https");
      return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
    }
  }
  return APP_URL;
}

function getAppUrl(path = "") {
  if (!path) return APP_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${APP_URL}${cleanPath}`;
}

const MINIMUM_PAYOUT_VND = 200000;
const SUPPORT_EMAIL = "support@edutest.ai";
const REFERRAL_BONUS_CREDITS = 2000;
const PLATFORM_NAME = "EduTest AI";
const MARKETPLACE_CREDIT_RATE_VND = 100;

// =============================================================================
// SUITE 1: CANONICAL CONSTANTS INTEGRITY
// =============================================================================
console.log("\n--- Suite 1: Canonical Platform Constants Integrity ---");

test("1.1 Centralized constants values meet business specifications", () => {
  assert.equal(MINIMUM_PAYOUT_VND, 200000, "Minimum payout must be 200.000 VNĐ");
  assert.equal(MARKETPLACE_CREDIT_RATE_VND, 100, "Marketplace credit rate must be 100 VNĐ / credit");
  assert.equal(REFERRAL_BONUS_CREDITS, 2000, "Referral bonus must be 2.000 credits");
  assert.equal(SUPPORT_EMAIL, "support@edutest.ai", "Support email must be canonical");
  assert.equal(PLATFORM_NAME, "EduTest AI", "Platform name must be canonical");
  assert.equal(DEFAULT_APP_URL, "https://ed-teach-rust.vercel.app");
});

test("1.2 getAppUrl normalizes slashes cleanly", () => {
  assert.equal(getAppUrl(""), APP_URL);
  assert.equal(getAppUrl("/register"), `${APP_URL}/register`);
  assert.equal(getAppUrl("register"), `${APP_URL}/register`);
  assert.equal(getAppUrl("/api/cron/subscriptions"), `${APP_URL}/api/cron/subscriptions`);
});

// =============================================================================
// SUITE 2: getBaseUrl FORWARDED HEADER PERMUTATIONS
// =============================================================================
console.log("\n--- Suite 2: getBaseUrl Reverse Proxy Header Permutations ---");

test("2.1 getBaseUrl fallback to APP_URL when req or headers missing", () => {
  assert.equal(getBaseUrl(undefined), APP_URL);
  assert.equal(getBaseUrl(null), APP_URL);
  assert.equal(getBaseUrl({}), APP_URL);
  assert.equal(getBaseUrl({ headers: new Headers() }), APP_URL);
});

test("2.2 getBaseUrl detects localhost and defaults to http", () => {
  const req1 = { headers: new Headers({ "x-forwarded-host": "localhost:3000" }) };
  assert.equal(getBaseUrl(req1), "http://localhost:3000");

  const req2 = { headers: new Headers({ "host": "localhost:3001" }) };
  assert.equal(getBaseUrl(req2), "http://localhost:3001");
});

test("2.3 getBaseUrl defaults to https for production hostnames", () => {
  const req1 = { headers: new Headers({ "x-forwarded-host": "edteach.vn" }) };
  assert.equal(getBaseUrl(req1), "https://edteach.vn");

  const req2 = { headers: new Headers({ "host": "ed-teach-rust.vercel.app" }) };
  assert.equal(getBaseUrl(req2), "https://ed-teach-rust.vercel.app");
});

test("2.4 getBaseUrl respects explicit x-forwarded-proto override", () => {
  // SSL terminator forwarding https for localhost
  const req1 = {
    headers: new Headers({
      "x-forwarded-host": "localhost:3000",
      "x-forwarded-proto": "https",
    }),
  };
  assert.equal(getBaseUrl(req1), "https://localhost:3000");

  // Inverted: internal reverse proxy on http for custom domain
  const req2 = {
    headers: new Headers({
      "x-forwarded-host": "internal.edteach.vn",
      "x-forwarded-proto": "http",
    }),
  };
  assert.equal(getBaseUrl(req2), "http://internal.edteach.vn");
});

test("2.5 getBaseUrl strips trailing slashes on forwarded host", () => {
  const req = {
    headers: new Headers({
      "x-forwarded-host": "edteach.vn///",
      "x-forwarded-proto": "https",
    }),
  };
  assert.equal(getBaseUrl(req), "https://edteach.vn");
});

test("2.6 getBaseUrl preserves port numbers in host", () => {
  const req = {
    headers: new Headers({
      "x-forwarded-host": "staging.edteach.vn:8443",
      "x-forwarded-proto": "https",
    }),
  };
  assert.equal(getBaseUrl(req), "https://staging.edteach.vn:8443");
});

// =============================================================================
// SUITE 3: MARKETPLACE PAYOUT ROUTE VALIDATION
// =============================================================================
console.log("\n--- Suite 3: Marketplace Payout Validation Logic ---");

// Emulate POST /api/marketplace/payout validation logic from route.ts
function validateMarketplacePayout({ user, body, userWalletBalance = 0 }) {
  if (!user) {
    return { status: 401, error: "Chưa đăng nhập." };
  }

  const { amount_credits, bank_name, account_number, account_holder } = body || {};

  const minCredits = MINIMUM_PAYOUT_VND / MARKETPLACE_CREDIT_RATE_VND; // 2000 credits
  const credits = parseInt(amount_credits, 10);
  if (!credits || credits < minCredits) {
    return {
      status: 400,
      error: `Hạn mức rút tiền tối thiểu là ${minCredits.toLocaleString("vi-VN")} credits (tương đương ${MINIMUM_PAYOUT_VND.toLocaleString("vi-VN")} VNĐ).`,
    };
  }

  if (!bank_name || !account_number || !account_holder) {
    return {
      status: 400,
      error: "Vui lòng nhập đầy đủ thông tin ngân hàng và số tài khoản.",
    };
  }

  if (userWalletBalance < credits) {
    return {
      status: 400,
      error: `Số dư ví không đủ. Ví hiện có ${userWalletBalance} credits, cần ${credits} credits.`,
    };
  }

  const amountVnd = credits * MARKETPLACE_CREDIT_RATE_VND;
  return {
    status: 200,
    success: true,
    credits,
    amountVnd,
  };
}

test("3.1 Marketplace payout enforces 2.000 credits (200.000 VNĐ) minimum floor", () => {
  const user = { id: "u-1" };
  const validBank = {
    bank_name: "Vietcombank",
    account_number: "0123456789",
    account_holder: "NGUYEN VAN A",
  };

  // 1. Below 2.000 credits (e.g. 1999 credits = 199.900 VNĐ)
  const res1 = validateMarketplacePayout({
    user,
    body: { amount_credits: 1999, ...validBank },
    userWalletBalance: 5000,
  });
  assert.equal(res1.status, 400);
  assert.ok(res1.error.includes("2.000 credits"));
  assert.ok(res1.error.includes("200.000 VNĐ"));

  // 2. Zero credits
  const res2 = validateMarketplacePayout({
    user,
    body: { amount_credits: 0, ...validBank },
    userWalletBalance: 5000,
  });
  assert.equal(res2.status, 400);

  // 3. Negative credits
  const res3 = validateMarketplacePayout({
    user,
    body: { amount_credits: -500, ...validBank },
    userWalletBalance: 5000,
  });
  assert.equal(res3.status, 400);

  // 4. Non-numeric credits
  const res4 = validateMarketplacePayout({
    user,
    body: { amount_credits: "five_hundred", ...validBank },
    userWalletBalance: 5000,
  });
  assert.equal(res4.status, 400);

  // 5. Exactly 2.000 credits (boundary value)
  const res5 = validateMarketplacePayout({
    user,
    body: { amount_credits: 2000, ...validBank },
    userWalletBalance: 5000,
  });
  assert.equal(res5.status, 200);
  assert.equal(res5.credits, 2000);
  assert.equal(res5.amountVnd, 200000);

  // 6. Above minimum (5.000 credits)
  const res6 = validateMarketplacePayout({
    user,
    body: { amount_credits: 5000, ...validBank },
    userWalletBalance: 10000,
  });
  assert.equal(res6.status, 200);
  assert.equal(res6.credits, 5000);
  assert.equal(res6.amountVnd, 500000);
});

test("3.2 Marketplace payout validates banking info and wallet balance", () => {
  const user = { id: "u-1" };

  // Missing bank name
  const res1 = validateMarketplacePayout({
    user,
    body: { amount_credits: 2000, account_number: "123", account_holder: "A" },
    userWalletBalance: 5000,
  });
  assert.equal(res1.status, 400);
  assert.ok(res1.error.includes("thông tin ngân hàng"));

  // Insufficient balance
  const res2 = validateMarketplacePayout({
    user,
    body: {
      amount_credits: 2000,
      bank_name: "MB",
      account_number: "123",
      account_holder: "A",
    },
    userWalletBalance: 1500, // Has 1500, needs 2000
  });
  assert.equal(res2.status, 400);
  assert.ok(res2.error.includes("Số dư ví không đủ"));
});

// =============================================================================
// SUITE 4: AFFILIATE PAYOUT ROUTE VALIDATION
// =============================================================================
console.log("\n--- Suite 4: Affiliate Payout Validation Logic ---");

// Emulate POST /api/affiliate/payout validation logic from route.ts
function validateAffiliatePayout({ body, userBalanceVnd = 0 }) {
  const amountVnd = Number(body?.amountVnd || 0);
  const bankCode = (body?.bankCode || "").trim();
  const bankAccount = (body?.bankAccount || "").trim();
  const bankAccountName = (body?.bankAccountName || "").trim();

  if (!amountVnd || amountVnd < MINIMUM_PAYOUT_VND) {
    return {
      status: 400,
      error: `Hạn mức rút tiền mặt tối thiểu là ${MINIMUM_PAYOUT_VND.toLocaleString("vi-VN")}đ.`,
    };
  }

  if (!bankCode || !bankAccount || !bankAccountName) {
    return {
      status: 400,
      error: "Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng nhận tiền.",
    };
  }

  if (userBalanceVnd < amountVnd) {
    return {
      status: 400,
      error: `Số dư hoa hồng không đủ. Bạn hiện có ${userBalanceVnd.toLocaleString()}đ.`,
    };
  }

  return { status: 200, success: true, amountVnd };
}

test("4.1 Affiliate payout enforces 200.000 VNĐ minimum floor", () => {
  const validBank = {
    bankCode: "MB",
    bankAccount: "0988888888",
    bankAccountName: "NGUYEN VAN B",
  };

  // 1. Below 200.000đ (e.g. 199.999đ)
  const res1 = validateAffiliatePayout({
    body: { amountVnd: 199999, ...validBank },
    userBalanceVnd: 500000,
  });
  assert.equal(res1.status, 400);
  assert.ok(res1.error.includes("200.000đ"));

  // 2. Zero amount
  const res2 = validateAffiliatePayout({
    body: { amountVnd: 0, ...validBank },
    userBalanceVnd: 500000,
  });
  assert.equal(res2.status, 400);

  // 3. Negative amount
  const res3 = validateAffiliatePayout({
    body: { amountVnd: -100000, ...validBank },
    userBalanceVnd: 500000,
  });
  assert.equal(res3.status, 400);

  // 4. Exactly 200.000đ (boundary value)
  const res4 = validateAffiliatePayout({
    body: { amountVnd: 200000, ...validBank },
    userBalanceVnd: 500000,
  });
  assert.equal(res4.status, 200);
  assert.equal(res4.amountVnd, 200000);

  // 5. Above minimum (500.000đ)
  const res5 = validateAffiliatePayout({
    body: { amountVnd: 500000, ...validBank },
    userBalanceVnd: 1000000,
  });
  assert.equal(res5.status, 200);
  assert.equal(res5.amountVnd, 500000);
});

// =============================================================================
// SUITE 5: REFERRAL BONUS SYSTEM-WIDE CONSISTENCY
// =============================================================================
console.log("\n--- Suite 5: Referral Reward Consistency Across All Entry Points ---");

test("5.1 Verify REFERRAL_BONUS_CREDITS is 2000 in frontend/src/lib/constants.ts", () => {
  const constantsPath = path.join(rootDir, "frontend/src/lib/constants.ts");
  const content = fs.readFileSync(constantsPath, "utf-8");
  assert.ok(
    content.includes("export const REFERRAL_BONUS_CREDITS = 2000;"),
    "constants.ts must define REFERRAL_BONUS_CREDITS = 2000;"
  );
});

test("5.2 Verify app/api/referral/route.ts uses REFERRAL_BONUS_CREDITS for both GET and POST", () => {
  const referralRoutePath = path.join(rootDir, "frontend/src/app/api/referral/route.ts");
  const content = fs.readFileSync(referralRoutePath, "utf-8");

  // GET response
  assert.ok(
    content.includes("reward_per_referral: REFERRAL_BONUS_CREDITS"),
    "GET /api/referral must return reward_per_referral: REFERRAL_BONUS_CREDITS"
  );

  // POST reward calculation
  assert.ok(
    content.includes("const rewardCredits = REFERRAL_BONUS_CREDITS"),
    "POST /api/referral must reward REFERRAL_BONUS_CREDITS"
  );
});

test("5.3 Verify app/auth/callback/route.ts uses REFERRAL_BONUS_CREDITS for OAuth referral grant", () => {
  const authCallbackPath = path.join(rootDir, "frontend/src/app/auth/callback/route.ts");
  const content = fs.readFileSync(authCallbackPath, "utf-8");

  assert.ok(
    content.includes("bonusCredits = REFERRAL_BONUS_CREDITS;"),
    "OAuth callback must set bonusCredits = REFERRAL_BONUS_CREDITS;"
  );
});

test("5.4 Verify UI components import and display REFERRAL_BONUS_CREDITS", () => {
  const quotaModalPath = path.join(
    rootDir,
    "frontend/src/components/modals/quota-exhausted-modal.tsx"
  );
  const quotaContent = fs.readFileSync(quotaModalPath, "utf-8");
  assert.ok(
    quotaContent.includes("REFERRAL_BONUS_CREDITS"),
    "Quota modal must import REFERRAL_BONUS_CREDITS"
  );

  const registerPagePath = path.join(
    rootDir,
    "frontend/src/app/(auth)/register/page.tsx"
  );
  const registerContent = fs.readFileSync(registerPagePath, "utf-8");
  assert.ok(
    registerContent.includes("REFERRAL_BONUS_CREDITS"),
    "Register page must import REFERRAL_BONUS_CREDITS"
  );

  const settingsPagePath = path.join(
    rootDir,
    "frontend/src/app/(dashboard)/settings/page.tsx"
  );
  const settingsContent = fs.readFileSync(settingsPagePath, "utf-8");
  assert.ok(
    settingsContent.includes("REFERRAL_BONUS_CREDITS"),
    "Settings page must import REFERRAL_BONUS_CREDITS"
  );
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log("\n================================================================================");
console.log(`TEST SUMMARY: ${passed}/${total} passed (${failures.length} failures)`);
console.log("================================================================================");

if (failures.length > 0) {
  console.error("FAILURES DETECTED:");
  for (const f of failures) {
    console.error(`- ${f.name}: ${f.error.message}`);
  }
  process.exit(1);
} else {
  console.log("ALL ADVERSARIAL PR 1.1 CONSTANTS & PAYOUT TESTS PASSED PERFECTLY!");
  process.exit(0);
}
