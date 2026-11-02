import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 12: Student Portal Core B2B2C & Online Exam Room (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 12), RC-04, RC-08, STU-06
 * Opaque-box contract: Student exam room join, exam listings, and automated grading logic.
 */
test.describe('Tier 1: Feature 12 - Student Portal Core B2B2C & Online Exam Room', () => {
  test('T1-F12-01: Joining exam requires exam code parameter', async ({ request }) => {
    const response = await request.post('/api/student/exams/join', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('T1-F12-02: Joining exam with non-existent code returns appropriate 400 error', async ({ request }) => {
    const response = await request.post('/api/student/exams/join', {
      data: { code: 'X' }, // invalid short code
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBeFalsy();
  });

  test('T1-F12-03: Student exams list endpoint returns structured response', async ({ request }) => {
    const response = await request.get('/api/student/exams');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.exams)).toBe(true);
  });

  test('T1-F12-04: MCQ grading endpoint computes perfect score for identical answers', async ({ request }) => {
    const answerKey = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    const studentAnswers = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };

    const response = await request.post('/api/grading', {
      data: {
        mode: 'mcq',
        answerKey,
        studentAnswers,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.score).toBe(10);
    expect(body.percentage).toBe(100);
    expect(body.correctCount).toBe(4);
    expect(body.incorrectCount).toBe(0);
  });

  test('T1-F12-05: MCQ grading endpoint handles partially correct answers accurately', async ({ request }) => {
    const answerKey = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    const studentAnswers = { 1: 'A', 2: 'B', 3: 'A', 4: 'B' }; // 2 correct, 2 incorrect

    const response = await request.post('/api/grading', {
      data: {
        mode: 'mcq',
        answerKey,
        studentAnswers,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.score).toBe(5);
    expect(body.percentage).toBe(50);
    expect(body.correctCount).toBe(2);
    expect(body.incorrectCount).toBe(2);
  });
});
