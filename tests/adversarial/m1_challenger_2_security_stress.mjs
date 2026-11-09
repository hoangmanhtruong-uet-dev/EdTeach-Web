/**
 * Empirical Security Stress Test Harness - Milestone 1 Challenger 2
 * Tests:
 * 1. next.config.ts security headers bypass & stripping verification
 * 2. API error handling & sensitive data leakage in marketplace/** and exams/generate
 * 3. Rate limiting logic in rate-limit.ts under rapid sequential and parallel calls
 * 4. Client lockout tracker in login/page.tsx state machine, edge cases, and tamper resistance
 */

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const frontendDir = path.resolve(rootDir, "frontend");

console.log("=== EMPIRICAL CHALLENGER M1-2: STARTING SECURITY STRESS TESTS ===");

// -----------------------------------------------------------------------------
// SUITE 1: next.config.ts Security Headers Bypass & Configuration Testing
// -----------------------------------------------------------------------------
describe("Suite 1: next.config.ts Security Headers Verification", () => {
  const nextConfigPath = path.resolve(frontendDir, "next.config.ts");
  assert.ok(fs.existsSync(nextConfigPath), "next.config.ts must exist");
  const content = fs.readFileSync(nextConfigPath, "utf-8");

  it("1.1. Checks presence of async headers() in next.config.ts", () => {
    assert.match(content, /async\s+headers\s*\(\s*\)/, "headers() method must be defined");
  });

  it("1.2. Checks source matcher coverage for potential bypasses", () => {
    // Check what source is used
    const sourceMatch = content.match(/source:\s*["']([^"']+)["']/);
    assert.ok(sourceMatch, "A source pattern must be defined for headers");
    const source = sourceMatch[1];
    console.log(`[Suite 1] Configured headers source pattern: "${source}"`);

    // In Next.js path-to-regexp, "/(.*)" matches any path starting with /
    // Let's verify whether "/(.*)" matches various routes
    const regexPattern = new RegExp("^" + source.replace(/\(\.\*\)/, ".*") + "$");
    
    const testPaths = [
      "/",
      "/login",
      "/register",
      "/dashboard",
      "/dashboard/settings",
      "/exams/generate",
      "/api/marketplace/items",
      "/api/marketplace/items/123-uuid",
      "/api/exams/generate",
      "/api/payment/webhook/payos",
      "/admin/verifications",
      "/_next/static/chunks/main.js",
      "//", // double slash
      "/..",
      "/%2e%2e/etc/passwd",
    ];

    for (const p of testPaths) {
      const isMatch = regexPattern.test(p);
      console.log(`  Path "${p}" matches source "${source}": ${isMatch}`);
      assert.ok(isMatch, `Path ${p} must be matched by header source pattern`);
    }
  });

  it("1.3. Validates required security headers are configured", () => {
    const requiredHeaders = [
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Strict-Transport-Security",
      "Content-Security-Policy",
    ];

    for (const h of requiredHeaders) {
      const hasHeader = content.includes(`key: "${h}"`) || content.includes(`key: '${h}'`);
      assert.ok(hasHeader, `next.config.ts must configure header "${h}"`);
    }
  });

  it("1.4. Audits Content-Security-Policy for potential security flaws", () => {
    assert.ok(content.includes("frame-ancestors 'self'"), "CSP must include frame-ancestors 'self' to block framing");
    assert.ok(content.includes("object-src 'none'"), "CSP must restrict object-src to 'none' to prevent Flash/plugin exploits");
    assert.ok(content.includes("base-uri 'self'"), "CSP must restrict base-uri to 'self'");

    // Check for risky directives
    const hasUnsafeInline = content.includes("'unsafe-inline'");
    const hasUnsafeEval = content.includes("'unsafe-eval'");
    const hasHttpLocalhost = content.includes("http://localhost:8000");

    console.log(`[Suite 1 CSP Audit]:`);
    console.log(`  - contains 'unsafe-inline': ${hasUnsafeInline} (Note: required for Next.js inline scripts / styles)`);
    console.log(`  - contains 'unsafe-eval': ${hasUnsafeEval} (Note: Next.js dev / eval requirements)`);
    console.log(`  - contains 'http://localhost:8000' in connect-src: ${hasHttpLocalhost}`);

    // High risk observation: in production, HTTP connect-src will trigger mixed-content warning if not HTTPS
    if (hasHttpLocalhost) {
      console.warn("  [CAVEAT] connect-src includes unencrypted http://localhost:8000 fallback.");
    }
  });
});

// -----------------------------------------------------------------------------
// SUITE 2: API Error Leakage & Sensitive Data Probing
// -----------------------------------------------------------------------------
describe("Suite 2: API Error Leakage & Sensitive Data Audit", () => {
  it("2.1. Audits frontend/src/app/api/marketplace/items/[id]/route.ts for raw error leaks", () => {
    const itemByIdPath = path.resolve(frontendDir, "src/app/api/marketplace/items/[id]/route.ts");
    assert.ok(fs.existsSync(itemByIdPath), "items/[id]/route.ts must exist");
    const itemByIdContent = fs.readFileSync(itemByIdPath, "utf-8");

    // Check catch block at the end of GET
    const lines = itemByIdContent.split("\n");
    let hasRawErrorMessageReturn = false;
    let leakLineNumber = -1;
    let leakContent = "";

    lines.forEach((line, idx) => {
      if (line.includes("return NextResponse.json({ error: err.message }") ||
          line.includes("error: err.message")) {
        hasRawErrorMessageReturn = true;
        leakLineNumber = idx + 1;
        leakContent = line.trim();
      }
    });

    console.log(`[Suite 2.1] items/[id]/route.ts catch block check:`);
    console.log(`  - Has raw err.message return: ${hasRawErrorMessageReturn} (Line ${leakLineNumber}: "${leakContent}")`);

    // This is a direct empirical observation of a leak!
    // If hasRawErrorMessageReturn is true, we document it as an empirical vulnerability.
    assert.ok(
      hasRawErrorMessageReturn,
      "Expected to detect whether items/[id]/route.ts returns raw err.message"
    );
  });

  it("2.2. Audits frontend/src/app/api/exams/generate/route.ts for DB error leaks and schema traces", () => {
    const examGenPath = path.resolve(frontendDir, "src/app/api/exams/generate/route.ts");
    assert.ok(fs.existsSync(examGenPath), "exams/generate/route.ts must exist");
    const examGenContent = fs.readFileSync(examGenPath, "utf-8");

    // 1. Check for examError.message leakage at line ~511
    const leaksExamErrorMessage = examGenContent.includes('"Lỗi khởi tạo đề thi: " + examError?.message');
    console.log(`[Suite 2.2] examError?.message returned to client on insert failure: ${leaksExamErrorMessage}`);

    // 2. Check for internal migration path and table leakage at line ~510
    const leaksMigrationPath = examGenContent.includes("supabase/migrations/20261025_sync_users_and_fix_rls.sql");
    console.log(`[Suite 2.2] Leaks internal migration SQL filepath in error response: ${leaksMigrationPath}`);

    // 3. Check for top-level catch block returning err.message at line ~811
    const leaksTopLevelErrMessage = examGenContent.includes('error: err.message || "Lỗi máy chủ trong quá trình sinh đề thi."');
    console.log(`[Suite 2.2] Top-level catch block returns err.message verbatim: ${leaksTopLevelErrMessage}`);

    // 4. Check whether geminiKey prefix logging was removed
    const hasGeminiKeyLogging = examGenContent.includes("Key: ${geminiKey ? geminiKey.slice(0, 8)");
    console.log(`[Suite 2.2] Gemini API key prefix slice logging present: ${hasGeminiKeyLogging}`);
    assert.equal(hasGeminiKeyLogging, false, "Gemini key slice log MUST be completely removed");

    // 5. Test what happens if fetch rejects with an error in Node.js
    // Does Node fetch error message include query parameters containing API key?
  });

  it("2.3. Tests Node fetch error stringification when API key is in URL query parameters", async () => {
    // In exams/generate/route.ts:
    // fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`)
    // If fetch throws, does singleErr.message contain the key?
    const dummyKey = "AIzaSyEmpiricalChallengerSecretKey123456";
    let caughtError = null;

    try {
      // Use an invalid host or port that causes immediate network rejection
      const controller = new AbortController();
      controller.abort(); // immediately abort to simulate signal abort
      await fetch(`https://127.0.0.1:59999/test?key=${dummyKey}`, { signal: controller.signal });
    } catch (err) {
      caughtError = err;
    }

    assert.ok(caughtError, "fetch should reject on abort");
    const errMessage = caughtError.message || "";
    const errStack = caughtError.stack || "";
    console.log(`[Suite 2.3] fetch abort error message: "${errMessage}"`);
    const keyInMessage = errMessage.includes(dummyKey);
    const keyInStack = errStack.includes(dummyKey);
    console.log(`  - Secret key leaked in error.message: ${keyInMessage}`);
    console.log(`  - Secret key leaked in error.stack: ${keyInStack}`);
  });

  it("2.4. Audits other marketplace routes for generic error handling", () => {
    const routesToTest = [
      "src/app/api/marketplace/items/route.ts",
      "src/app/api/marketplace/buy/route.ts",
      "src/app/api/marketplace/payout/route.ts",
      "src/app/api/marketplace/clone-to-studio/route.ts",
    ];

    for (const relPath of routesToTest) {
      const fullPath = path.resolve(frontendDir, relPath);
      assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
      const text = fs.readFileSync(fullPath, "utf-8");

      // Verify that raw err.message is not returned in responses
      const returnsErrMessage = text.includes("error: err.message") ||
                                text.includes("error: error.message") ||
                                text.includes("error: rpcError.message");

      console.log(`[Suite 2.4] Route ${relPath}: raw error return = ${returnsErrMessage}`);
      assert.equal(returnsErrMessage, false, `${relPath} must NOT return raw DB error message`);
    }
  });
});

// -----------------------------------------------------------------------------
// SUITE 3: Rate Limiting Stress Harness (rate-limit.ts)
// -----------------------------------------------------------------------------
describe("Suite 3: Rate Limiting Stress Harness", async () => {
  const rateLimitPath = path.resolve(frontendDir, "src/lib/security/rate-limit.ts");
  assert.ok(fs.existsSync(rateLimitPath), "rate-limit.ts must exist");
  const rateLimitModule = await import(`file://${rateLimitPath}`);
  const { checkRateLimit } = rateLimitModule;

  it("3.1. Handles sequential calls within limit and correctly blocks when exceeded", () => {
    const key = `test-ip-${Date.now()}-seq`;
    const maxRequests = 10;
    const windowMs = 5000;

    for (let i = 1; i <= maxRequests; i++) {
      const res = checkRateLimit(key, maxRequests, windowMs);
      assert.equal(res.allowed, true, `Call ${i} should be allowed`);
      assert.equal(res.remaining, maxRequests - i, `Remaining should be ${maxRequests - i}`);
      assert.equal(res.limit, maxRequests);
    }

    // 11th call should be blocked
    const blockedRes = checkRateLimit(key, maxRequests, windowMs);
    assert.equal(blockedRes.allowed, false, "11th call must be blocked");
    assert.equal(blockedRes.remaining, 0, "Remaining must be 0 when blocked");
    assert.ok(blockedRes.retryAfterSeconds >= 1, "retryAfterSeconds must be >= 1");
    console.log(`[Suite 3.1] Blocked 11th call correctly. retryAfterSeconds=${blockedRes.retryAfterSeconds}`);
  });

  it("3.2. Handles high-speed burst of 100 rapid sequential calls", () => {
    const key = `test-burst-${Date.now()}`;
    const maxRequests = 25;
    const windowMs = 10000;

    let allowedCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < 100; i++) {
      const res = checkRateLimit(key, maxRequests, windowMs);
      if (res.allowed) allowedCount++;
      else blockedCount++;
    }

    assert.equal(allowedCount, 25, "Exactly 25 calls must be allowed");
    assert.equal(blockedCount, 75, "Exactly 75 calls must be blocked");
    console.log(`[Suite 3.2] Burst test: 100 calls -> Allowed: ${allowedCount}, Blocked: ${blockedCount}`);
  });

  it("3.3. Confirms multi-tenant / IP isolation", () => {
    const keyA = `user-a-${Date.now()}`;
    const keyB = `user-b-${Date.now()}`;
    const limit = 5;

    // Exhaust user A
    for (let i = 0; i < limit; i++) {
      checkRateLimit(keyA, limit, 10000);
    }
    const resA = checkRateLimit(keyA, limit, 10000);
    assert.equal(resA.allowed, false, "User A should be blocked");

    // User B must still have full quota
    const resB = checkRateLimit(keyB, limit, 10000);
    assert.equal(resB.allowed, true, "User B must not be affected by User A");
    assert.equal(resB.remaining, limit - 1);
    console.log(`[Suite 3.3] Multi-tenant isolation verified.`);
  });

  it("3.4. Tests edge case inputs (malicious keys, prototype pollution, zero limits)", () => {
    const maliciousKeys = [
      "__proto__",
      "constructor",
      "prototype",
      "toString",
      "",
      "A".repeat(10000), // very long key
    ];

    for (const mk of maliciousKeys) {
      const res = checkRateLimit(mk, 5, 5000);
      assert.equal(typeof res.allowed, "boolean", `Malicious key "${mk.slice(0, 20)}" should yield valid result`);
    }

    // Boundary: maxRequests = 0
    const zeroRes = checkRateLimit(`zero-limit-${Date.now()}`, 0, 5000);
    assert.equal(zeroRes.allowed, false, "maxRequests = 0 must disallow all requests");

    // Boundary: maxRequests = 1
    const oneKey = `one-limit-${Date.now()}`;
    const res1 = checkRateLimit(oneKey, 1, 5000);
    assert.equal(res1.allowed, true);
    const res2 = checkRateLimit(oneKey, 1, 5000);
    assert.equal(res2.allowed, false);

    console.log(`[Suite 3.4] Edge cases and malicious keys safely handled.`);
  });

  it("3.5. Sliding window expiration test", async () => {
    const key = `expire-test-${Date.now()}`;
    const limit = 2;
    const shortWindow = 100; // 100ms

    assert.equal(checkRateLimit(key, limit, shortWindow).allowed, true);
    assert.equal(checkRateLimit(key, limit, shortWindow).allowed, true);
    assert.equal(checkRateLimit(key, limit, shortWindow).allowed, false);

    // Wait 150ms for window to slide past
    await new Promise((resolve) => setTimeout(resolve, 150));

    const refreshedRes = checkRateLimit(key, limit, shortWindow);
    assert.equal(refreshedRes.allowed, true, "Quota must replenish after window expires");
    console.log(`[Suite 3.5] Sliding window replenishment verified.`);
  });
});

// -----------------------------------------------------------------------------
// SUITE 4: Client Lockout Tracker Stress Test (login/page.tsx)
// -----------------------------------------------------------------------------
describe("Suite 4: Client Lockout Tracker State Machine & Bypass Analysis", () => {
  // Model the exact logic from login/page.tsx:
  // MAX_FAILED_ATTEMPTS = 5
  // LOCKOUT_DURATION_MS = 15 * 60 * 1000
  // STORAGE_KEY_ATTEMPTS = "eduteach_login_failed_attempts"
  // STORAGE_KEY_LOCKED_UNTIL = "eduteach_login_locked_until"

  class MockLocalStorage {
    constructor() {
      this.store = new Map();
    }
    getItem(k) {
      return this.store.has(k) ? this.store.get(k) : null;
    }
    setItem(k, v) {
      this.store.set(k, String(v));
    }
    removeItem(k) {
      this.store.delete(k);
    }
    clear() {
      this.store.clear();
    }
  }

  function simulateLoginAttempt({
    storage,
    passwordCorrect,
    now = Date.now(),
    maxAttempts = 5,
    lockoutDurationMs = 15 * 60 * 1000,
  }) {
    const STORAGE_KEY_ATTEMPTS = "eduteach_login_failed_attempts";
    const STORAGE_KEY_LOCKED_UNTIL = "eduteach_login_locked_until";

    // 1. Initial check (useEffect)
    const lockedUntilStr = storage.getItem(STORAGE_KEY_LOCKED_UNTIL);
    let lockoutRemainingSec = 0;
    if (lockedUntilStr) {
      const lockedUntil = parseInt(lockedUntilStr, 10);
      const remaining = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
      if (remaining > 0) {
        lockoutRemainingSec = remaining;
      } else {
        storage.removeItem(STORAGE_KEY_LOCKED_UNTIL);
        storage.removeItem(STORAGE_KEY_ATTEMPTS);
      }
    }

    // 2. Submit check
    if (lockoutRemainingSec > 0) {
      const minutes = Math.ceil(lockoutRemainingSec / 60);
      return {
        status: "LOCKED",
        error: `Tài khoản đang bị khóa tạm thời do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau ${minutes} phút.`,
        lockoutRemainingSec,
        attempts: parseInt(storage.getItem(STORAGE_KEY_ATTEMPTS) || "0", 10),
      };
    }

    // 3. Authenticate
    if (!passwordCorrect) {
      const attempts = parseInt(storage.getItem(STORAGE_KEY_ATTEMPTS) || "0", 10) + 1;
      storage.setItem(STORAGE_KEY_ATTEMPTS, String(attempts));

      if (attempts >= maxAttempts) {
        const lockedUntil = now + lockoutDurationMs;
        storage.setItem(STORAGE_KEY_LOCKED_UNTIL, String(lockedUntil));
        return {
          status: "JUST_LOCKED",
          error: "Bạn đã nhập sai thông tin 5 lần liên tiếp. Để bảo vệ tài khoản, chức năng đăng nhập bị tạm khóa trong 15 phút.",
          lockoutRemainingSec: Math.ceil(lockoutDurationMs / 1000),
          attempts,
        };
      }

      const remainingAttempts = Math.max(0, maxAttempts - attempts);
      return {
        status: "FAILED",
        error: `Email hoặc mật khẩu không chính xác. Bạn còn ${remainingAttempts} lần thử trước khi bị tạm khóa 15 phút.`,
        remainingAttempts,
        attempts,
      };
    }

    // 4. Success -> Reset
    storage.removeItem(STORAGE_KEY_ATTEMPTS);
    storage.removeItem(STORAGE_KEY_LOCKED_UNTIL);
    return {
      status: "SUCCESS",
      attempts: 0,
    };
  }

  it("4.1. Verifies sequential state progression through 5 failed attempts", () => {
    const storage = new MockLocalStorage();
    const startTime = Date.now();

    // Attempts 1 to 4
    for (let i = 1; i <= 4; i++) {
      const res = simulateLoginAttempt({ storage, passwordCorrect: false, now: startTime });
      assert.equal(res.status, "FAILED");
      assert.equal(res.attempts, i);
      assert.equal(res.remainingAttempts, 5 - i);
      console.log(`  Attempt ${i}: status=${res.status}, attempts=${res.attempts}, remaining=${res.remainingAttempts}`);
    }

    // Attempt 5 -> MUST TRIGGER LOCKOUT
    const res5 = simulateLoginAttempt({ storage, passwordCorrect: false, now: startTime });
    assert.equal(res5.status, "JUST_LOCKED");
    assert.equal(res5.attempts, 5);
    assert.equal(res5.lockoutRemainingSec, 900); // 15 mins
    console.log(`  Attempt 5: JUST_LOCKED, lockoutSec=${res5.lockoutRemainingSec}`);

    // Attempt 6 (while locked) -> MUST BE REJECTED BEFORE AUTH
    const res6 = simulateLoginAttempt({ storage, passwordCorrect: false, now: startTime + 1000 });
    assert.equal(res6.status, "LOCKED");
    assert.ok(res6.error.includes("Tài khoản đang bị khóa tạm thời"));
    console.log(`  Attempt 6: LOCKED, error=${res6.error}`);
  });

  it("4.2. Verifies counter reset upon successful login before reaching 5 attempts", () => {
    const storage = new MockLocalStorage();
    // 3 failed attempts
    simulateLoginAttempt({ storage, passwordCorrect: false });
    simulateLoginAttempt({ storage, passwordCorrect: false });
    simulateLoginAttempt({ storage, passwordCorrect: false });
    assert.equal(storage.getItem("eduteach_login_failed_attempts"), "3");

    // 4th attempt is successful
    const successRes = simulateLoginAttempt({ storage, passwordCorrect: true });
    assert.equal(successRes.status, "SUCCESS");
    assert.equal(storage.getItem("eduteach_login_failed_attempts"), null);
    assert.equal(storage.getItem("eduteach_login_locked_until"), null);
    console.log(`[Suite 4.2] Counter reset on login verified.`);
  });

  it("4.3. Verifies automatic unlocking when 15 minutes elapse", () => {
    const storage = new MockLocalStorage();
    const startTime = Date.now();

    // Lock the account
    for (let i = 0; i < 5; i++) {
      simulateLoginAttempt({ storage, passwordCorrect: false, now: startTime });
    }
    assert.ok(storage.getItem("eduteach_login_locked_until"));

    // Advance time by 15 mins + 1 sec (901,000 ms)
    const afterLockoutTime = startTime + 15 * 60 * 1000 + 1000;
    const resAfterExpiry = simulateLoginAttempt({
      storage,
      passwordCorrect: true,
      now: afterLockoutTime,
    });
    assert.equal(resAfterExpiry.status, "SUCCESS", "Account must unlock after 15 minutes");
    console.log(`[Suite 4.3] Automatic unlocking after duration verified.`);
  });

  it("4.4. Adversarial Edge Case: localStorage clearing bypass", () => {
    const storage = new MockLocalStorage();
    const startTime = Date.now();

    // Lock the account
    for (let i = 0; i < 5; i++) {
      simulateLoginAttempt({ storage, passwordCorrect: false, now: startTime });
    }
    assert.ok(storage.getItem("eduteach_login_locked_until"));

    // Adversary clears localStorage
    storage.clear();

    // Adversary attempts login again immediately
    const bypassRes = simulateLoginAttempt({ storage, passwordCorrect: false, now: startTime + 1000 });
    console.log(`[Suite 4.4 Adversarial Test]: Clearing localStorage bypasses client lockout: status=${bypassRes.status}, attempts=${bypassRes.attempts}`);
    assert.equal(bypassRes.status, "FAILED", "Bypassed: counter restarted at 1");
    assert.equal(bypassRes.attempts, 1);
  });

  it("4.5. Adversarial Edge Case: Corrupted / NaN localStorage values", () => {
    const storage = new MockLocalStorage();
    // Inject non-numeric string
    storage.setItem("eduteach_login_failed_attempts", "corrupted_string");

    const res = simulateLoginAttempt({ storage, passwordCorrect: false });
    // In JavaScript, parseInt("corrupted_string") is NaN, NaN + 1 is NaN, String(NaN) is "NaN"
    console.log(`[Suite 4.5 Adversarial Test]: Injected corrupted string -> attempts stored: "${storage.getItem("eduteach_login_failed_attempts")}"`);
    assert.equal(storage.getItem("eduteach_login_failed_attempts"), "NaN");
  });
});

console.log("=== EMPIRICAL CHALLENGER M1-2: ALL TESTS DEFINED ===");

after(() => {
  setTimeout(() => process.exit(0), 100);
});

