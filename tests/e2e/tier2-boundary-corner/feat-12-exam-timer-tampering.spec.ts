import { test, expect } from '@playwright/test';

/**
 * Tier 2 — Feature 12: Student Portal Core B2B2C & Online Exam Room (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 12), RC-04, RC-08, STU-06
 * Opaque-box contract: Exam code boundaries, corrupted answer sheets, and grading edge conditions.
 */
test.describe('Tier 2: Feature 12 - Exam Timer & Student Portal Corner Cases', () => {
  test('T2-F12-01: Joining exam with 1-character code returns 400', async ({ request }) => {
    const response = await request.post('/api/student/exams/join', {
      data: { code: 'A' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('3 ký tự');
  });

  test('T2-F12-02: Joining exam with 2-character code returns 400', async ({ request }) => {
    const response = await request.post('/api/student/exams/join', {
      data: { code: '12' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('3 ký tự');
  });

  test('T2-F12-03: Grading MCQ with empty answerKey object returns 400', async ({ request }) => {
    const response = await request.post('/api/grading', {
      data: {
        mode: 'mcq',
        answerKey: {},
        studentAnswers: { 1: 'A' },
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('T2-F12-04: Grading MCQ with missing mode returns 400', async ({ request }) => {
    const response = await request.post('/api/grading', {
      data: {
        answerKey: { 1: 'A' },
        studentAnswers: { 1: 'A' },
      },
    });
    expect(response.status()).toBe(400);
  });

  test('T2-F12-05: Grading MCQ with invalid mode string returns 400', async ({ request }) => {
    const response = await request.post('/api/grading', {
      data: {
        mode: 'hack_mode',
        answerKey: { 1: 'A' },
        studentAnswers: { 1: 'A' },
      },
    });
    expect(response.status()).toBe(400);
  });
});
