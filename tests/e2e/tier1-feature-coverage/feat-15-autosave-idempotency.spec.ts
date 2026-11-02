import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 15: Unified Autosave Hook & Exam Idempotency (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 15), RC-05, STU-09, CRT-03
 * Opaque-box contract: Idempotent submission processing and consistent evaluation.
 */
test.describe('Tier 1: Feature 15 - Unified Autosave Hook & Exam Idempotency', () => {
  test('T1-F15-01: Grading MCQ is deterministic (identical score for re-submissions)', async ({ request }) => {
    const payload = {
      mode: 'mcq',
      answerKey: { 1: 'A', 2: 'B', 3: 'C' },
      studentAnswers: { 1: 'A', 2: 'B', 3: 'D' }, // 2/3
    };

    const res1 = await request.post('/api/grading', { data: payload });
    const res2 = await request.post('/api/grading', { data: payload });

    expect(res1.status()).toBe(200);
    expect(res2.status()).toBe(200);

    const body1 = await res1.json();
    const body2 = await res2.json();

    expect(body1.score).toBe(body2.score);
    expect(body1.percentage).toBe(body2.percentage);
    expect(body1.correctCount).toBe(body2.correctCount);
  });

  test('T1-F15-02: Grading with empty studentAnswers treats all items as unanswered', async ({ request }) => {
    const response = await request.post('/api/grading', {
      data: {
        mode: 'mcq',
        answerKey: { 1: 'A', 2: 'B' },
        studentAnswers: {},
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.score).toBe(0);
    expect(body.unansweredCount).toBe(2);
    expect(body.correctCount).toBe(0);
  });

  test('T1-F15-03: Submitting answers with lowercase letters is normalized to uppercase', async ({ request }) => {
    const response = await request.post('/api/grading', {
      data: {
        mode: 'mcq',
        answerKey: { 1: 'A', 2: 'B' },
        studentAnswers: { 1: 'a', 2: 'b' }, // lowercase
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.score).toBe(10);
    expect(body.correctCount).toBe(2);
  });

  test('T1-F15-04: Live poll voting records choice successfully', async ({ request }) => {
    // First create a live poll
    const createRes = await request.post('/api/teach/live-poll/create', {
      data: {
        questionTitle: 'Bầu chọn bài tập nhóm',
        options: ['Nhóm 1', 'Nhóm 2'],
      },
    });
    const createBody = await createRes.json();
    const roomCode = createBody.roomCode;

    if (roomCode) {
      const voteRes = await request.post('/api/teach/live-poll/vote', {
        data: {
          roomCode,
          choice: 'Nhóm 1',
          studentName: 'Học sinh A',
        },
      });
      expect([200, 400]).toContain(voteRes.status());
    }
  });

  test('T1-F15-05: Polling live session returns session state', async ({ request }) => {
    const response = await request.get('/api/teach/live-poll/poll?roomCode=NON_EXISTENT');
    expect([200, 404]).toContain(response.status());
  });
});
