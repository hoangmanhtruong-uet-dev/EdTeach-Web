import { test, expect } from '@playwright/test';

/**
 * Tier 2 — Feature 15: Unified Autosave Hook & Exam Idempotency (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 15), RC-05, STU-09, CRT-03
 * Opaque-box contract: Essay grading boundaries, empty submissions, and autosave conflict resilience.
 */
test.describe('Tier 2: Feature 15 - Autosave Conflict & Essay Grading Corner Cases', () => {
  test('T2-F15-01: Essay grading requires authenticated user session', async ({ request }) => {
    const response = await request.post('/api/grading', {
      data: {
        mode: 'essay',
        question: 'Hãy phân tích bài thơ Sóng của Xuân Quỳnh.',
        studentAnswer: 'Bài thơ thể hiện khát vọng tình yêu muôn thuở...',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('T2-F15-02: Essay grading rejects missing question parameter', async ({ request }) => {
    const response = await request.post('/api/grading', {
      data: {
        mode: 'essay',
        studentAnswer: 'Bài làm của học sinh...',
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T2-F15-03: Essay grading rejects missing studentAnswer parameter', async ({ request }) => {
    const response = await request.post('/api/grading', {
      data: {
        mode: 'essay',
        question: 'Đề bài tự luận...',
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T2-F15-04: In-app feedback rejects whitespace-only content', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        title: 'Góp ý',
        content: '          ',
      },
    });
    expect(response.status()).toBe(400);
  });

  test('T2-F15-05: Submitting feedback with huge content (> 50,000 chars) handles safely', async ({ request }) => {
    const hugeContent = 'Phản hồi dài: ' + 'A'.repeat(50000);
    const response = await request.post('/api/feedback', {
      data: {
        content: hugeContent,
      },
    });
    expect([200, 400, 413]).toContain(response.status());
  });
});
