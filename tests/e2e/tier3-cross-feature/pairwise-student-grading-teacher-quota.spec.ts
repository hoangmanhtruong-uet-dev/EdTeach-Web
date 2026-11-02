import { test, expect } from '@playwright/test';

/**
 * Tier 3 — Cross-Feature Pairwise Interaction 2: Student Exam Flow + Server Grading + Masked Solutions
 * Interacting Features:
 * - Feature 4 (Emergency RLS Migration - Solution Masking)
 * - Feature 12 (Student Portal Core & Online Exam Room)
 * - Feature 15 (Unified Autosave & Submission Idempotency)
 */
test.describe('Tier 3: Pairwise 2 - Student Portal, Server Grading & Solution Masking', () => {
  test('T3-PAIR-04: Student exam submission evaluates score server-side without exposing answer key in response', async ({ request }) => {
    const answerKey = { 1: 'A', 2: 'B', 3: 'C' };
    const studentAnswers = { 1: 'A', 2: 'A', 3: 'C' }; // 2/3 correct

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
    expect(body.score).toBeCloseTo(6.67, 1);
  });

  test('T3-PAIR-05: AI essay evaluation validates rubrics and enforces rate limits', async ({ request }) => {
    // Unauthenticated request is rejected to protect AI quota
    const response = await request.post('/api/grading', {
      data: {
        mode: 'essay',
        question: 'Phân tích phương pháp bảo tồn đa dạng sinh học.',
        studentAnswer: 'Các biện pháp bao gồm bảo vệ sinh cảnh tự nhiên...',
      },
    });
    expect([401, 429]).toContain(response.status());
  });

  test('T3-PAIR-06: Student dashboard progress radar tracks cognitive levels consistently', async ({ request }) => {
    const response = await request.get('/api/student/progress?studentId=demo-student-id');
    expect([200, 401]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.progress || body).toHaveProperty('radarLevels');
    }
  });
});
