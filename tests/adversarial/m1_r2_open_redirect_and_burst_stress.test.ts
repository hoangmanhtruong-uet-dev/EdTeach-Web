/**
 * tests/adversarial/m1_r2_open_redirect_and_burst_stress.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE — ITERATION 2
 * Challenger M1 R2 1 (Technical Security Challenger 1 - Iteration 2)
 *
 * Specific Verification Objectives:
 * 1. Open Redirect stress testing against real Next.js middleware (frontend/src/middleware.ts):
 *    - /\\evil.com, /\evil.com, //evil.com, /sub\\evil.com, https://evil.com
 *    - URL-encoded payloads: /%5c%5cevil.com, /%5cevil.com, /%2f%2fevil.com
 *    - Confirm all external redirects are blocked and fallback safely to /dashboard.
 *    - Confirm legitimate internal routes (/dashboard, /exams, /teach) redirect correctly.
 * 2. Rate Limiting in /api/exams/generate under burst traffic:
 *    - High-velocity burst traffic (100 rapid requests in <10ms).
 *    - Concurrent asynchronous bursts (Promise.all).
 *    - Multi-tenant isolation (IP keys and User keys).
 *    - Header spoofing resistance (cf-connecting-ip vs x-forwarded-for).
 *    - Dual-layer defense: IP limiter (10/min) + User limiter (10/min).
 *    - Retry-After header calculation and sliding window replenishment.
 */

import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";
import { checkRateLimit } from "../../frontend/src/lib/security/rate-limit";
import { getClientIp } from "../../frontend/src/lib/security/client-ip";

// Configure test environment
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock_anon_key";
process.env.ADMIN_EMAIL = "admin@edteach.vn";

// Intercept @supabase/ssr module resolution to inject mocked authenticated session for middleware execution
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (modulePath: string) {
  if (
    modulePath === "@supabase/ssr" ||
    modulePath.endsWith("@supabase/ssr/src/index.ts") ||
    modulePath.endsWith("@supabase/ssr/dist/main/index.js")
  ) {
    return {
      createServerClient: () => ({
        auth: {
          getUser: async () => ({
            data: {
              user: {
                id: "usr_test_authenticated_789",
                email: "teacher@edteach.vn",
                app_metadata: { role: "teacher" },
                user_metadata: { role: "teacher" },
              },
            },
            error: null,
          }),
        },
      }),
    };
  }
  return originalRequire.apply(this, arguments as any);
};

// Load NextRequest and authentic middleware from frontend
const { NextRequest } = require(path.resolve(__dirname, "../../frontend/node_modules/next/server.js"));
const { middleware } = require(path.resolve(__dirname, "../../frontend/src/middleware.ts"));

console.log("================================================================================");
console.log("EMPIRICAL ADVERSARIAL STRESS TEST: ITERATION 2 (OPEN REDIRECT & BURST HARNESS)");
console.log("================================================================================\n");

let passedCount = 0;
let totalCount = 0;
const testFailures: Array<{ name: string; error: any }> = [];

async function runEmpiricalTest(name: string, fn: () => void | Promise<void>) {
  totalCount++;
  try {
    await fn();
    passedCount++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    testFailures.push({ name, error: err });
    console.error(`  [FAIL] ${name}`);
    console.error(`         Details: ${err.message}`);
  }
}

async function main() {
  // ===========================================================================
  // SECTION 1: EMPIRICAL OPEN REDIRECT STRESS TESTING AGAINST MIDDLEWARE.TS
  // ===========================================================================
  console.log("--- Section 1: Open Redirect Probes against frontend/src/middleware.ts ---");

  const baseUrl = "http://localhost:3000";

  // 1. Mandatory Payloads from Orchestrator Dispatch
  const mandatoryPayloads = [
    { payload: "/\\\\evil.com", label: "/\\\\evil.com (double backslash)" },
    { payload: "/\\evil.com", label: "/\\evil.com (single backslash)" },
    { payload: "//evil.com", label: "//evil.com (protocol-relative)" },
    { payload: "/sub\\\\evil.com", label: "/sub\\\\evil.com (embedded double backslash)" },
    { payload: "https://evil.com", label: "https://evil.com (absolute external URL)" },
  ];

  for (const { payload, label } of mandatoryPayloads) {
    await runEmpiricalTest(`1.1 Mandatory Payload '${label}' on /login?redirectTo is blocked`, async () => {
      const target = `${baseUrl}/login?redirectTo=${encodeURIComponent(payload)}`;
      const req = new NextRequest(target);
      const res = await middleware(req);

      assert.equal(res.status, 307, `Expected 307 redirect status, got ${res.status}`);
      const location = res.headers.get("location");
      assert.equal(
        location,
        `${baseUrl}/dashboard`,
        `Payload ${label} MUST redirect safely to /dashboard! Got: ${location}`
      );
      assert.ok(!location?.includes("evil.com"), `Location must NOT contain external domain: ${location}`);
    });

    await runEmpiricalTest(`1.2 Mandatory Payload '${label}' on /login?next is blocked`, async () => {
      const target = `${baseUrl}/login?next=${encodeURIComponent(payload)}`;
      const req = new NextRequest(target);
      const res = await middleware(req);

      assert.equal(res.status, 307, `Expected 307 redirect status, got ${res.status}`);
      const location = res.headers.get("location");
      assert.equal(
        location,
        `${baseUrl}/dashboard`,
        `Payload ${label} via 'next' param MUST redirect safely to /dashboard! Got: ${location}`
      );
      assert.ok(!location?.includes("evil.com"), `Location must NOT contain external domain: ${location}`);
    });

    await runEmpiricalTest(`1.3 Mandatory Payload '${label}' on /register?redirectTo is blocked`, async () => {
      const target = `${baseUrl}/register?redirectTo=${encodeURIComponent(payload)}`;
      const req = new NextRequest(target);
      const res = await middleware(req);

      assert.equal(res.status, 307, `Expected 307 redirect status, got ${res.status}`);
      const location = res.headers.get("location");
      assert.equal(
        location,
        `${baseUrl}/dashboard`,
        `Payload ${label} on /register MUST redirect safely to /dashboard! Got: ${location}`
      );
      assert.ok(!location?.includes("evil.com"), `Location must NOT contain external domain: ${location}`);
    });
  }

  // 1.4 Single-encoded URL payloads as received from HTTP clients
  const singleEncodedPayloads = [
    { query: "/login?redirectTo=/%5C%5Cevil.com", label: "/%5C%5Cevil.com" },
    { query: "/login?redirectTo=/%5cevil.com", label: "/%5cevil.com" },
    { query: "/login?redirectTo=/%2f%2fevil.com", label: "/%2f%2fevil.com" },
    { query: "/login?redirectTo=/%2f%5cevil.com", label: "/%2f%5cevil.com" },
  ];

  for (const { query, label } of singleEncodedPayloads) {
    await runEmpiricalTest(`1.4 Single-encoded payload '${label}' is blocked and returns /dashboard`, async () => {
      const target = `${baseUrl}${query}`;
      const req = new NextRequest(target);
      const res = await middleware(req);

      assert.equal(res.status, 307);
      const location = res.headers.get("location");
      assert.equal(
        location,
        `${baseUrl}/dashboard`,
        `Single-encoded payload '${label}' must safely fall back to /dashboard! Got: ${location}`
      );
    });
  }

  // 1.5 Deep Edge Case & Obfuscated Payloads
  const advancedAdversarialPayloads = [
    "///evil.com",
    "////evil.com",
    "/\\/evil.com",
    "/\\../evil.com",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://attacker.com",
    "http://localhost:3000.evil.com",
    "//localhost:3000.attacker.com",
    "/sub/..\\evil.com",
    "\\\\evil.com",
    "\\evil.com",
  ];

  for (const attack of advancedAdversarialPayloads) {
    await runEmpiricalTest(`1.5 Advanced Payload '${attack}' is blocked and returns /dashboard`, async () => {
      const target = `${baseUrl}/login?redirectTo=${encodeURIComponent(attack)}`;
      const req = new NextRequest(target);
      const res = await middleware(req);

      assert.equal(res.status, 307);
      const location = res.headers.get("location");
      assert.equal(
        location,
        `${baseUrl}/dashboard`,
        `Obfuscated attack '${attack}' must safely fall back to /dashboard! Got: ${location}`
      );
      assert.ok(!location?.includes("attacker.com") && !location?.includes("evil.com"));
    });
  }

  // 1.6 Double-encoded Payloads Origin Check (Must never escape origin)
  const doubleEncodedPayloads = [
    "/login?redirectTo=%255c%255cevil.com",
    "/login?redirectTo=%252f%252fevil.com",
  ];

  for (const query of doubleEncodedPayloads) {
    await runEmpiricalTest(`1.6 Double-encoded '${query}' never redirects to external origin`, async () => {
      const target = `${baseUrl}${query}`;
      const req = new NextRequest(target);
      const res = await middleware(req);

      assert.equal(res.status, 307);
      const location = res.headers.get("location");
      const resolved = new URL(location!, baseUrl);
      assert.equal(resolved.origin, baseUrl, `Must stay strictly on local origin ${baseUrl}! Got: ${resolved.origin}`);
      assert.ok(!resolved.hostname.includes("evil.com"));
    });
  }

  // 1.7 Legitimate Internal Paths Allowed
  const legitimatePaths = [
    "/dashboard",
    "/exams",
    "/exams/create",
    "/teach/exam-123",
    "/settings/profile",
    "/exams/123?tab=questions&sort=asc",
  ];

  for (const legit of legitimatePaths) {
    await runEmpiricalTest(`1.7 Legitimate internal path '${legit}' is correctly allowed`, async () => {
      const target = `${baseUrl}/login?redirectTo=${encodeURIComponent(legit)}`;
      const req = new NextRequest(target);
      const res = await middleware(req);

      assert.equal(res.status, 307);
      const location = res.headers.get("location");
      assert.equal(location, `${baseUrl}${legit}`);
    });
  }

  // ===========================================================================
  // SECTION 2: RATE LIMITING IN /api/exams/generate UNDER BURST TRAFFIC
  // ===========================================================================
  console.log("\n--- Section 2: Rate Limiting Stress Harness under Burst Traffic ---");

  // 2.1 Rapid Sequential Burst (100 rapid requests in <10ms)
  await runEmpiricalTest("2.1 High-speed burst: exactly 10 requests allowed, remaining 90 blocked (HTTP 429)", () => {
    const burstKey = `exam_gen:ip:burst_test_${Date.now()}`;
    let allowedCount = 0;
    let blockedCount = 0;
    let lastRetryAfter = 0;

    for (let i = 0; i < 100; i++) {
      const result = checkRateLimit(burstKey, 10, 60000);
      if (result.allowed) {
        allowedCount++;
        assert.equal(result.remaining, 10 - allowedCount);
      } else {
        blockedCount++;
        assert.equal(result.remaining, 0);
        assert.ok(result.retryAfterSeconds && result.retryAfterSeconds > 0);
        lastRetryAfter = result.retryAfterSeconds;
      }
    }

    assert.equal(allowedCount, 10, `Expected exactly 10 allowed calls, got ${allowedCount}`);
    assert.equal(blockedCount, 90, `Expected exactly 90 blocked calls, got ${blockedCount}`);
    assert.ok(lastRetryAfter >= 55 && lastRetryAfter <= 60, `Expected Retry-After ~60s, got ${lastRetryAfter}`);
  });

  // 2.2 Concurrent Asynchronous Burst (Promise.all)
  await runEmpiricalTest("2.2 Concurrent asynchronous burst with 50 parallel requests", async () => {
    const concurrentKey = `exam_gen:ip:async_burst_${Date.now()}`;
    const promises = Array.from({ length: 50 }, (_, i) => {
      return Promise.resolve(checkRateLimit(concurrentKey, 10, 60000));
    });

    const results = await Promise.all(promises);
    const allowed = results.filter((r) => r.allowed).length;
    const blocked = results.filter((r) => !r.allowed).length;

    assert.equal(allowed, 10, `Expected 10 allowed in parallel burst, got ${allowed}`);
    assert.equal(blocked, 40, `Expected 40 blocked in parallel burst, got ${blocked}`);
  });

  // 2.3 Multi-Tenant IP Isolation
  await runEmpiricalTest("2.3 Multi-Tenant IP Isolation: burst on IP A does not affect IP B", () => {
    const ipA = `exam_gen:ip:198.51.100.1_${Date.now()}`;
    const ipB = `exam_gen:ip:198.51.100.2_${Date.now()}`;

    // Exhaust IP A
    for (let i = 0; i < 10; i++) {
      assert.equal(checkRateLimit(ipA, 10, 60000).allowed, true);
    }
    assert.equal(checkRateLimit(ipA, 10, 60000).allowed, false);

    // IP B must have full fresh quota
    for (let i = 0; i < 10; i++) {
      assert.equal(checkRateLimit(ipB, 10, 60000).allowed, true);
    }
    assert.equal(checkRateLimit(ipB, 10, 60000).allowed, false);
  });

  // 2.4 User-Level Rate Limiting Across Rotating Client IPs
  await runEmpiricalTest("2.4 User-level rate limiting blocks attacker rotating client IPs", () => {
    const userId = `usr_attacker_${Date.now()}`;
    const userLimitKey = `exam_gen:user:${userId}`;

    // Attacker rotates 20 different proxy IPs for same user account
    let allowedUserRequests = 0;
    let blockedUserRequests = 0;

    for (let i = 0; i < 20; i++) {
      const proxyIp = `10.0.${Math.floor(i / 256)}.${i % 256}`;
      const ipLimit = checkRateLimit(`exam_gen:ip:${proxyIp}`, 10, 60000);
      assert.equal(ipLimit.allowed, true, "Fresh IP should pass IP limiter");

      // Now check User limiter (as in exams/generate line 327)
      const userLimit = checkRateLimit(userLimitKey, 10, 60000);
      if (userLimit.allowed) {
        allowedUserRequests++;
      } else {
        blockedUserRequests++;
      }
    }

    assert.equal(allowedUserRequests, 10, "User must only get 10 allowed requests despite rotating IP!");
    assert.equal(blockedUserRequests, 10, "Remaining 10 requests must be blocked by User rate limiter!");
  });

  // 2.5 Cloudflare Client IP Extraction & Header Spoofing Resistance
  await runEmpiricalTest("2.5 getClientIp prioritizes cf-connecting-ip to resist header spoofing", () => {
    // Attack scenario: Attacker sends spoofed X-Forwarded-For: 1.1.1.1, but Cloudflare sets cf-connecting-ip
    const spoofHeaders = new Headers({
      "x-forwarded-for": "1.1.1.1, 10.0.0.1",
      "x-real-ip": "2.2.2.2",
      "cf-connecting-ip": "203.0.113.195",
    });

    const resolvedIp = getClientIp({ headers: spoofHeaders });
    assert.equal(resolvedIp, "203.0.113.195", "Cloudflare cf-connecting-ip must take precedence!");
  });

  // 2.6 Simulation of /api/exams/generate Two-Layer Defense Pipeline
  await runEmpiricalTest("2.6 Full route simulation: IP rate limit followed by User rate limit", () => {
    const testIp = `192.0.2.${Math.floor(Math.random() * 200)}`;
    const testUser = `usr_student_${Date.now()}`;

    // Pipeline function identical to frontend/src/app/api/exams/generate/route.ts
    function simulateExamGeneratePipeline(ip: string, user: { id: string } | null) {
      // Step 1: IP rate limit check (lines 271-285)
      const ipLimit = checkRateLimit(`exam_gen:ip:${ip}`, 10, 60000);
      if (!ipLimit.allowed) {
        return {
          status: 429,
          body: { error: "TOO_MANY_REQUESTS", message: "IP rate limit exceeded" },
          retryAfter: ipLimit.retryAfterSeconds,
        };
      }

      // Step 2: Auth check
      if (!user) {
        return { status: 401, body: { error: "Bạn cần đăng nhập để thực hiện chức năng này." } };
      }

      // Step 3: User rate limit check (lines 327-340)
      const userLimit = checkRateLimit(`exam_gen:user:${user.id}`, 10, 60000);
      if (!userLimit.allowed) {
        return {
          status: 429,
          body: { error: "TOO_MANY_REQUESTS", message: "User rate limit exceeded" },
          retryAfter: userLimit.retryAfterSeconds,
        };
      }

      return { status: 200, body: { success: true } };
    }

    // Send 10 valid calls -> 200
    for (let i = 0; i < 10; i++) {
      const res = simulateExamGeneratePipeline(testIp, { id: testUser });
      assert.equal(res.status, 200);
    }

    // 11th call from same IP & user -> 429 via IP limiter
    const burst11 = simulateExamGeneratePipeline(testIp, { id: testUser });
    assert.equal(burst11.status, 429);
    assert.equal(burst11.body.error, "TOO_MANY_REQUESTS");
    assert.ok(burst11.retryAfter && burst11.retryAfter > 0);

    // Call from DIFFERENT IP but SAME user -> 429 via User limiter
    const burstDifferentIp = simulateExamGeneratePipeline("198.51.100.99", { id: testUser });
    assert.equal(burstDifferentIp.status, 429);
    assert.equal(burstDifferentIp.body.message, "User rate limit exceeded");

    // Call from NEW IP with NEW user -> passes
    const freshRes = simulateExamGeneratePipeline("198.51.100.100", { id: `usr_new_${Date.now()}` });
    assert.equal(freshRes.status, 200);
  });

  // ===========================================================================
  // SUMMARY AND VERDICT
  // ===========================================================================
  console.log("\n================================================================================");
  console.log(`STRESS TEST SUMMARY: ${passedCount}/${totalCount} PASSED`);
  if (testFailures.length > 0) {
    console.error(`FAILED TESTS: ${testFailures.length}`);
    for (const f of testFailures) {
      console.error(`- ${f.name}: ${f.error.message}`);
    }
    console.log("VERDICT: REJECT");
    process.exit(1);
  } else {
    console.log("ALL TESTS PASSED WITH ZERO FAILURES!");
    console.log("VERDICT: CONFIRM_CORRECT");
    console.log("================================================================================");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal Test Suite Crash:", err);
  process.exit(1);
});
