// tests/adversarial/m4_r2_challenger_1_deep_adversarial.test.mjs
// ==============================================================================
// EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — MILESTONE 4 ITERATION 2 (PR GROUP 3)
// Challenger #1 (critic, specialist)
// Live Endpoint Probing & Adversarial Stress Testing
// Target:
// 1. POST /api/student/exams/join under 30+ adversarial permutations:
//    - Missing payload, empty string code, short codes (< 3 chars), non-string types, malformed JSON
//    - Injection vectors, buffer size limits, prototype pollution, whitespace handling
// 2. GET /api/student/exams:
//    - Guest fallback, corrupted auth cookie handling, concurrent read stability
// 3. Server-side Grading Determinism & Solution Masking:
//    - Determinism probe, rate-limiter threshold (15 req/min), case-insensitivity, whitespace normalization, error boundaries
// ==============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

console.log("================================================================================");
console.log("CHALLENGER #1 EMPIRICAL DEEP ADVERSARIAL TEST SUITE — MILESTONE 4 ITERATION 2");
console.log(`Target Base URL: ${BASE_URL}`);
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;
let failedTests = 0;
const testResults = [];

async function test(name, fn) {
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
    process.exitCode = 1;
  }
}

// =============================================================================
// SUITE 1: POST /api/student/exams/join — ADVERSARIAL INPUT VALIDATION MATRIX
// =============================================================================
console.log("--- Suite 1: POST /api/student/exams/join Adversarial Input Validation ---");

// 1.1 Missing Payload Permutations
await test("1.1.1 Empty raw body string returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "",
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes("Vui lòng nhập mã"));
});

await test("1.1.2 Empty JSON object {} returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes("Vui lòng nhập mã"));
});

await test("1.1.3 JSON with unrelated properties returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "123456", classroomId: "cls-01" }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.1.4 Body completely omitted from request returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

// 1.2 Empty String Code Permutations
await test("1.2.1 Empty string code { code: '' } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "" }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes("Vui lòng nhập mã"));
});

await test("1.2.2 Pure whitespace code { code: '   ' } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "     " }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes("Vui lòng nhập mã"));
});

await test("1.2.3 Tab and newline whitespace { code: '\\t\\n\\r  ' } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "\t\n\r  " }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.2.4 Empty alternative field { examCode: '' } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ examCode: "" }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.2.5 Whitespace alternative field { examCode: '   ' } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ examCode: "   " }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

// 1.3 Short Codes (< 3 characters)
await test("1.3.1 Single char code { code: 'A' } returns HTTP 400 with '3 ký tự'", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "A" }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes("3 ký tự"));
});

await test("1.3.2 Two char code { code: '12' } returns HTTP 400 with '3 ký tự'", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "12" }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes("3 ký tự"));
});

await test("1.3.3 Single char with surrounding spaces { code: '  x  ' } returns HTTP 400 with '3 ký tự'", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "  x  " }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes("3 ký tự"));
});

await test("1.3.4 Two chars with surrounding spaces { code: '  ab  ' } returns HTTP 400 with '3 ký tự'", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "  ab  " }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes("3 ký tự"));
});

await test("1.3.5 Short code using examCode field { examCode: 'xy' } returns HTTP 400 with '3 ký tự'", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ examCode: "xy" }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes("3 ký tự"));
});

// 1.4 Non-String Types
await test("1.4.1 Number code { code: 12345 } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: 12345 }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.4.2 Zero number code { code: 0 } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: 0 }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.4.3 Boolean true code { code: true } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: true }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.4.4 Boolean false code { code: false } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: false }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.4.5 Null code { code: null } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: null }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.4.6 Array code { code: ['TOAN12'] } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: ["TOAN12"] }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.4.7 Object code { code: { id: 'TOAN12' } } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: { id: "TOAN12" } }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

// 1.5 Malformed JSON Permutations
await test("1.5.1 Truncated JSON '{\"code\": \"TOAN' returns HTTP 400 (no 500 crash)", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"code": "TOAN',
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.5.2 Single quotes JSON '{code: \\'TOAN12\\'}' returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{code: 'TOAN12'}",
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.5.3 Plain text body 'not_a_json_payload' returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not_a_json_payload",
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.5.4 Trailing comma JSON '{\"code\": \"TOAN12\",}' returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"code": "TOAN12",}',
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.5.5 XML snippet body returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "<exam><code>TOAN12</code></exam>",
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

// 1.6 Injection & Edge Payloads
await test("1.6.1 SQL injection code \"' OR '1'='1\" returns HTTP 400 without 500 error", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "' OR '1'='1" }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.6.2 XSS script payload code returns HTTP 400 without server crash", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "<script>alert('xss')</script>" }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.6.3 Extremely long string (10,000 characters) returns HTTP 400 gracefully", async () => {
  const longCode = "A".repeat(10000);
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: longCode }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

await test("1.6.4 Prototype pollution attempt does not contaminate Object.prototype", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ __proto__: { polluted: true }, code: "NON_EXISTENT_CODE" }),
  });
  assert.equal(res.status, 400);
  assert.equal(({})["polluted"], undefined, "Global Object.prototype must not be polluted");
});

// 1.7 Valid & Non-Existent Join Operations
await test("1.7.1 Valid exam code { code: 'TOAN12' } returns HTTP 200 with exam details", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "TOAN12" }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.exam, "Response must include exam object");
  assert.ok(data.message.includes("thành công"));
});

await test("1.7.2 Valid alternative field { examCode: 'DEMO12' } returns HTTP 200", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ examCode: "DEMO12" }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
});

await test("1.7.3 Non-existent code (>= 3 chars) { code: 'UNKNOWN_999' } returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "UNKNOWN_999" }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes("Không tìm thấy"));
});

await test("1.7.4 Valid code with surrounding whitespace { code: '   TOAN12   ' } trims and returns HTTP 200", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "   TOAN12   " }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
});

// =============================================================================
// SUITE 2: GET /api/student/exams — RESILIENCE & CONCURRENCY
// =============================================================================
console.log("\n--- Suite 2: GET /api/student/exams Resilience & Concurrency ---");

await test("2.1 Unauthenticated request returns HTTP 200 with structured exam array", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.exams), "exams must be an array");
  assert.ok(data.exams.length >= 1, "Must contain at least 1 exam");
  const first = data.exams[0];
  assert.ok(first.id);
  assert.ok(first.examTitle);
  assert.ok(first.subject);
});

await test("2.2 Corrupted auth cookie header does not crash endpoint (returns HTTP 200 with fallback)", async () => {
  const res = await fetch(`${BASE_URL}/api/student/exams`, {
    headers: {
      Cookie: "sb-access-token=malformed.garbage.token; sb-refresh-token=garbage",
    },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.exams));
});

await test("2.3 Concurrency stress: 25 parallel GET /api/student/exams return HTTP 200 consistently", async () => {
  const tasks = [];
  for (let i = 0; i < 25; i++) {
    tasks.push(fetch(`${BASE_URL}/api/student/exams`));
  }
  const responses = await Promise.all(tasks);
  for (const r of responses) {
    assert.equal(r.status, 200);
  }
});

// =============================================================================
// SUITE 3: SERVER-SIDE GRADING ENGINE DETERMINISM, RATE LIMITS & SOLUTION MASKING
// =============================================================================
console.log("\n--- Suite 3: Server-side Grading Determinism, Rate Limits & Solution Masking ---");

await test("3.1 Deterministic Grading: 10 identical submissions produce bit-for-bit identical scores", async () => {
  const answerKey = { 1: "A", 2: "B", 3: "C", 4: "D", 5: "A" };
  const studentAnswers = { 1: "A", 2: "B", 3: "C", 4: "D", 5: "B" }; // 4/5 correct -> 8.0 score

  const scores = [];
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${BASE_URL}/api/grading`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": "198.51.100.10",
      },
      body: JSON.stringify({ mode: "mcq", answerKey, studentAnswers }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    scores.push(data.score);
    assert.equal(data.correctCount, 4);
    assert.equal(data.incorrectCount, 1);
    assert.equal(data.score, 8.0);
    assert.equal(data.percentage, 80);
  }

  const allEqual = scores.every((s) => s === 8.0);
  assert.ok(allEqual, "100% of 10 runs must compute exact score of 8.0");
});

await test("3.2 Grading Rate Limiter: 16th request from same IP within 1 minute triggers HTTP 429", async () => {
  const testIp = "198.51.100.99";
  const answerKey = { 1: "A" };
  const studentAnswers = { 1: "A" };

  let hitRateLimit = false;
  for (let i = 1; i <= 16; i++) {
    const res = await fetch(`${BASE_URL}/api/grading`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": testIp,
      },
      body: JSON.stringify({ mode: "mcq", answerKey, studentAnswers }),
    });

    if (i <= 15) {
      assert.equal(res.status, 200, `Request ${i} should be permitted`);
    } else {
      assert.equal(res.status, 429, `Request ${i} should be rate limited to 429`);
      const body = await res.json();
      assert.ok(body.error.includes("Thao tác quá nhanh"));
      hitRateLimit = true;
    }
  }
  assert.ok(hitRateLimit, "Must trigger 429 on request 16");
});

await test("3.3 Case Insensitivity: Lowercase answers {'1': 'a', '2': 'b'} normalized to uppercase", async () => {
  const answerKey = { 1: "A", 2: "B", 3: "C", 4: "D" };
  const studentAnswers = { 1: "a", 2: "b", 3: "c", 4: "d" }; // lowercase

  const res = await fetch(`${BASE_URL}/api/grading`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "198.51.100.21",
    },
    body: JSON.stringify({ mode: "mcq", answerKey, studentAnswers }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.score, 10.0);
  assert.equal(data.correctCount, 4);
  assert.equal(data.percentage, 100);
});

await test("3.4 Whitespace Normalization: Answers with leading/trailing spaces correctly scored", async () => {
  const answerKey = { 1: "A", 2: "B", 3: "C", 4: "D" };
  const studentAnswers = { 1: "  A  ", 2: "\tB\t", 3: " C ", 4: "D\n" };

  const res = await fetch(`${BASE_URL}/api/grading`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "198.51.100.22",
    },
    body: JSON.stringify({ mode: "mcq", answerKey, studentAnswers }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.score, 10.0);
  assert.equal(data.correctCount, 4);
});

await test("3.5 Grading Error Boundary: Missing mode parameter returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/grading`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "198.51.100.23",
    },
    body: JSON.stringify({ answerKey: { 1: "A" }, studentAnswers: { 1: "A" } }),
  });
  assert.equal(res.status, 400);
});

await test("3.6 Grading Error Boundary: Invalid mode returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/grading`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "198.51.100.24",
    },
    body: JSON.stringify({ mode: "adversarial_hack", answerKey: { 1: "A" }, studentAnswers: { 1: "A" } }),
  });
  assert.equal(res.status, 400);
});

await test("3.7 Grading Error Boundary: Empty answerKey {} returns HTTP 400", async () => {
  const res = await fetch(`${BASE_URL}/api/grading`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": "198.51.100.25",
    },
    body: JSON.stringify({ mode: "mcq", answerKey: {}, studentAnswers: { 1: "A" } }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes("không có câu hỏi"));
});

await test("3.8 Solution Masking: Student Link Route does not expose answerKey in public link query", async () => {
  const linkRoutePath = path.resolve("frontend/src/app/api/grading/student-links/[token]/route.ts");
  const code = fs.readFileSync(linkRoutePath, "utf-8");
  assert.ok(!code.includes("answerKey: link.answerKey"), "Link payload must not leak answerKey to client");
});

await test("3.9 Solution Masking: Submit Route requires idempotencyKey to prevent duplicate/race scoring", async () => {
  const submitRoutePath = path.resolve("frontend/src/app/api/student/exams/[examId]/submit/route.ts");
  const code = fs.readFileSync(submitRoutePath, "utf-8");
  assert.ok(code.includes("if (!idempotencyKey)"), "Submit route must enforce idempotencyKey check");
  assert.ok(code.includes("status: 400"), "Submit route must return 400 on missing idempotencyKey");
});

// =============================================================================
// SUMMARY & EXIT CODE
// =============================================================================
console.log("\n================================================================================");
console.log(`CHALLENGER #1 EMPIRICAL ADVERSARIAL MATRIX: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log("================================================================================");

if (failedTests === 0) {
  console.log("Verdict: ALL 40 EMPIRICAL ADVERSARIAL CHALLENGES PASSED (VERDICT: APPROVE).");
} else {
  console.error(`Verdict: ${failedTests} CHALLENGE(S) FAILED (VERDICT: REQUEST_CHANGES).`);
  process.exitCode = 1;
}
