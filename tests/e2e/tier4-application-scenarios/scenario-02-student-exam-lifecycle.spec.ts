import { test, expect } from '@playwright/test';

/**
 * Tier 4 — Scenario 2: Student Exam Room Lifecycle & Server-side Grading
 * Full End-to-End Workflow:
 * 1. Student enters exam code to enroll in classroom exam.
 * 2. Exam room loads question items with attempt timer.
 * 3. Student submits answers -> server grading computes score with masked solution key.
 */
test.describe('Tier 4: Scenario 2 - Student Exam Room Join, Take & Server Grading Flow', () => {
  test('T4-SCEN-03: Student exam joining and enrollment creation', async ({ request }) => {
    // 1. Student submits code to join exam
    const joinRes = await request.post('/api/student/exams/join', {
      data: { code: 'TOAN12' },
    });

    expect(joinRes.status()).toBe(200);
    const joinBody = await joinRes.json();
    expect(joinBody.success).toBe(true);
    expect(joinBody.exam).toBeDefined();

    // 2. Verify joined exam is now visible in student exam list
    const examsRes = await request.get('/api/student/exams');
    expect(examsRes.status()).toBe(200);
    const examsBody = await examsRes.json();
    expect(examsBody.exams.length).toBeGreaterThanOrEqual(1);
  });

  test('T4-SCEN-04: Student exam submission and automated grading cycle', async ({ request }) => {
    // 1. Simulate answering a 10-question GDPT exam
    const answerKey = {
      1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'A',
      6: 'B', 7: 'C', 8: 'D', 9: 'A', 10: 'B',
    };
    const studentAnswers = {
      1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'A',
      6: 'B', 7: 'C', 8: 'D', 9: 'C', 10: 'D', // 8/10 correct
    };

    // 2. Submit to server-side grading
    const gradeRes = await request.post('/api/grading', {
      data: {
        mode: 'mcq',
        answerKey,
        studentAnswers,
      },
    });

    expect(gradeRes.status()).toBe(200);
    const result = await gradeRes.json();
    expect(result.success).toBe(true);
    expect(result.score).toBe(8.0);
    expect(result.correctCount).toBe(8);
    expect(result.incorrectCount).toBe(2);
    expect(result.totalQuestions).toBe(10);
  });
});
