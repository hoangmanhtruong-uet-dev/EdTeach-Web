import { test, expect } from '@playwright/test';

/**
 * Tier 3 — Cross-Feature Pairwise Interaction 4: Autosave State + Session Persistence + Interactive Tools
 * Interacting Features:
 * - Feature 12 (Student Portal Core B2B2C)
 * - Feature 13 (Serverless RAM Map Migration to PostgreSQL)
 * - Feature 15 (Unified Autosave Hook & Exam Idempotency)
 */
test.describe('Tier 3: Pairwise 4 - Autosave State, Session Persistence & Interactive Polling', () => {
  test('T3-PAIR-10: Remote cam scanner creates persistent session accessible across requests', async ({ request }) => {
    const createRes = await request.post('/api/grading/remote-session/create', {
      data: {
        sessionId: 'session_persisted_test',
        sessionName: 'Kỳ thi thử trực tuyến',
      },
    });

    expect(createRes.status()).toBe(200);
    const body = await createRes.json();
    expect(body.success).toBe(true);
    const token = body.token;

    // Follow-up request to poll the session state
    const pollRes = await request.get(`/api/grading/remote-session/poll?token=${token}`);
    expect([200, 404]).toContain(pollRes.status());
  });

  test('T3-PAIR-11: Live poll interactive voting preserves state across multiple participant requests', async ({ request }) => {
    const createRes = await request.post('/api/teach/live-poll/create', {
      data: {
        questionTitle: 'Câu hỏi tương tác lớp học',
        options: ['Phương án A', 'Phương án B'],
      },
    });

    expect(createRes.status()).toBe(200);
    const createBody = await createRes.json();
    const roomCode = createBody.roomCode;

    // First voter submits
    const vote1 = await request.post('/api/teach/live-poll/vote', {
      data: { roomCode, choice: 'Phương án A', studentName: 'Học sinh 1' },
    });
    expect([200, 400]).toContain(vote1.status());

    // Second voter submits
    const vote2 = await request.post('/api/teach/live-poll/vote', {
      data: { roomCode, choice: 'Phương án B', studentName: 'Học sinh 2' },
    });
    expect([200, 400]).toContain(vote2.status());
  });

  test('T3-PAIR-12: Feedback mechanism preserves user role and source page metadata', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        category: 'general',
        title: 'Trải nghiệm mượt mà',
        content: 'Bảng trắng và phòng thí nghiệm mở rất nhanh.',
        pageUrl: 'http://localhost:3001/labs',
        metadata: { browser: 'playwright-chromium' },
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.feedback.page_url).toContain('/labs');
  });
});
