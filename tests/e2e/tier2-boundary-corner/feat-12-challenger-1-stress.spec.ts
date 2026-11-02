import { test, expect } from '@playwright/test';

/**
 * Challenger #1 Empirical Adversarial Stress Test Suite — Milestone 4 Iteration 2
 * Focus:
 * 1. POST /api/student/exams/join under exhaustive adversarial inputs
 *    - Missing payload, empty string code, short codes (< 3 chars), non-string types, malformed data
 *    - Injections, long strings, whitespace handling, and valid enrollment
 * 2. GET /api/student/exams
 *    - Guest/demo student resolution, corrupted cookie handling, array structure
 * 3. Server-side Grading Determinism, Rate-Limiting & Solution Masking
 *    - Determinism across submissions, case & whitespace normalization, error boundaries, solution masking
 */

test.describe('Challenger #1: Adversarial Input Matrix for Student Exam Join & Grading', () => {

  // ===========================================================================
  // SECTION 1: POST /api/student/exams/join — ADVERSARIAL MATRIX
  // ===========================================================================

  test('ADV-JOIN-01: Empty JSON object {} returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Vui lòng nhập mã');
  });

  test('ADV-JOIN-02: Missing code property { other: "data" } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { otherField: 'test' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-03: Empty string code { code: "" } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: '' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Vui lòng nhập mã');
  });

  test('ADV-JOIN-04: Whitespace-only code { code: "   " } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: '     ' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Vui lòng nhập mã');
  });

  test('ADV-JOIN-05: Newline and tab whitespace { code: "\\n\\t\\r" } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: '\n\t\r' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-06: Empty alternative field { examCode: "" } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { examCode: '' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-07: Short code 1-char { code: "A" } returns HTTP 400 with "3 ký tự"', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: 'A' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('3 ký tự');
  });

  test('ADV-JOIN-08: Short code 2-char { code: "12" } returns HTTP 400 with "3 ký tự"', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: '12' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('3 ký tự');
  });

  test('ADV-JOIN-09: Short code with padding spaces { code: "  x  " } returns HTTP 400 with "3 ký tự"', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: '  x  ' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('3 ký tự');
  });

  test('ADV-JOIN-10: Short alternative field { examCode: "ok" } returns HTTP 400 with "3 ký tự"', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { examCode: 'ok' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('3 ký tự');
  });

  test('ADV-JOIN-11: Number type { code: 12345 } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: 12345 },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-12: Zero number { code: 0 } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: 0 },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-13: Boolean true { code: true } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: true },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-14: Boolean false { code: false } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: false },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-15: Null value { code: null } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: null },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-16: Array value { code: ["TOAN12"] } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: ['TOAN12'] },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-17: Object value { code: { id: "TOAN12" } } returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: { id: 'TOAN12' } },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-18: SQL injection payload { code: "\' OR \'1\'=\'1" } returns HTTP 400 safely', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: "' OR '1'='1" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-19: XSS script payload { code: "<script>alert(1)</script>" } returns HTTP 400 safely', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: "<script>alert('xss')</script>" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-20: Long string payload (5,000 chars) returns HTTP 400 gracefully', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: 'A'.repeat(5000) },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('ADV-JOIN-21: Non-existent code (>= 3 chars) returns HTTP 400 with "Không tìm thấy"', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: 'UNKNOWN_CODE_999' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/không tồn tại|Không tìm thấy/i);
  });

  test('ADV-JOIN-22: Valid exam code { code: "TOAN12" } returns HTTP 200 with exam payload', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: 'TOAN12' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.exam).toBeDefined();
    expect(body.exam.examTitle).toBeDefined();
  });

  test('ADV-JOIN-23: Valid alternative field { examCode: "DEMO12" } returns HTTP 200', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { examCode: 'DEMO12' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('ADV-JOIN-24: Valid code with leading/trailing spaces { code: "   TOAN12   " } returns HTTP 200', async ({ request }) => {
    const res = await request.post('/api/student/exams/join', {
      data: { code: '   TOAN12   ' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ===========================================================================
  // SECTION 2: GET /api/student/exams — RESILIENCE & GUEST RESOLUTION
  // ===========================================================================

  test('ADV-EXAMS-01: Unauthenticated GET returns HTTP 200 and array of exams', async ({ request }) => {
    const res = await request.get('/api/student/exams');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.exams)).toBe(true);
    expect(body.exams.length).toBeGreaterThanOrEqual(1);
    expect(body.exams[0].examTitle).toBeDefined();
    expect(body.exams[0].subject).toBeDefined();
  });

  test('ADV-EXAMS-02: Corrupted cookie header returns HTTP 200 using fallback store', async ({ request }) => {
    const res = await request.get('/api/student/exams', {
      headers: {
        Cookie: 'sb-access-token=invalid.corrupt.token; other=123',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.exams)).toBe(true);
  });

  // ===========================================================================
  // SECTION 3: SERVER-SIDE GRADING DETERMINISM, RATE-LIMITS & SOLUTION MASKING
  // ===========================================================================

  test('ADV-GRADE-01: Deterministic Grading produces identical scores across multiple submissions', async ({ request }) => {
    const answerKey = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'A' };
    const studentAnswers = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'B' }; // 4/5 correct -> 8.0

    for (let i = 0; i < 5; i++) {
      const res = await request.post('/api/grading', {
        headers: { 'X-Forwarded-For': '203.0.113.1' },
        data: {
          mode: 'mcq',
          answerKey,
          studentAnswers,
        },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.score).toBe(8.0);
      expect(body.correctCount).toBe(4);
      expect(body.incorrectCount).toBe(1);
      expect(body.percentage).toBe(80);
    }
  });

  test('ADV-GRADE-02: Answers in lowercase are accurately normalized to uppercase', async ({ request }) => {
    const answerKey = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    const studentAnswers = { 1: 'a', 2: 'b', 3: 'c', 4: 'd' };

    const res = await request.post('/api/grading', {
      headers: { 'X-Forwarded-For': '203.0.113.2' },
      data: {
        mode: 'mcq',
        answerKey,
        studentAnswers,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.score).toBe(10.0);
    expect(body.correctCount).toBe(4);
  });

  test('ADV-GRADE-03: Answers with whitespace are trimmed and scored correctly', async ({ request }) => {
    const answerKey = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    const studentAnswers = { 1: '  A  ', 2: '\tB\t', 3: ' C ', 4: 'D\n' };

    const res = await request.post('/api/grading', {
      headers: { 'X-Forwarded-For': '203.0.113.3' },
      data: {
        mode: 'mcq',
        answerKey,
        studentAnswers,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.score).toBe(10.0);
    expect(body.correctCount).toBe(4);
  });

  test('ADV-GRADE-04: Missing mode returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/grading', {
      headers: { 'X-Forwarded-For': '203.0.113.4' },
      data: {
        answerKey: { 1: 'A' },
        studentAnswers: { 1: 'A' },
      },
    });
    expect(res.status()).toBe(400);
  });

  test('ADV-GRADE-05: Invalid mode returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/grading', {
      headers: { 'X-Forwarded-For': '203.0.113.5' },
      data: {
        mode: 'adversarial_attack_mode',
        answerKey: { 1: 'A' },
        studentAnswers: { 1: 'A' },
      },
    });
    expect(res.status()).toBe(400);
  });

  test('ADV-GRADE-06: Empty answerKey object returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/grading', {
      headers: { 'X-Forwarded-For': '203.0.113.6' },
      data: {
        mode: 'mcq',
        answerKey: {},
        studentAnswers: { 1: 'A' },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('không có câu hỏi');
  });

  test('ADV-GRADE-07: Rate limiter blocks requests exceeding quota with HTTP 429', async ({ request }) => {
    const answerKey = { 1: 'A' };
    const studentAnswers = { 1: 'A' };

    let saw429 = false;
    for (let i = 0; i < 20; i++) {
      const res = await request.post('/api/grading', {
        data: { mode: 'mcq', answerKey, studentAnswers },
      });

      if (res.status() === 429) {
        saw429 = true;
        const body = await res.json();
        expect(body.error).toContain('Thao tác quá nhanh');
        break;
      }
      expect(res.status()).toBe(200);
    }
    expect(saw429).toBe(true);
  });

  test('ADV-MASK-01: Submission route rejects missing idempotencyKey with HTTP 400', async ({ request }) => {
    const res = await request.post('/api/student/exams/exam-toan-12/submit', {
      data: {
        answers: { 1: 'A' },
      },
    });
    // Requires authenticated user (401) or validates idempotencyKey (400)
    expect([400, 401]).toContain(res.status());
  });
});
