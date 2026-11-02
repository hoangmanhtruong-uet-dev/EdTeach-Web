import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 13: Serverless RAM Map Migration to PostgreSQL (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 13), RC-07, SEC-08, STU-07
 * Opaque-box contract: State persistence across serverless executions (sessions, tokens, polls).
 */
test.describe('Tier 1: Feature 13 - Serverless RAM Map Migration to PostgreSQL', () => {
  test('T1-F13-01: Remote cam session creation generates token and PIN', async ({ request }) => {
    const response = await request.post('/api/grading/remote-session/create', {
      data: {
        sessionId: 'test-session-123',
        sessionName: 'Kỳ thi kiểm tra 1 tiết',
        subject: 'Toán',
        grade: '12',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    expect(body.pin).toBeDefined();
    expect(body.directUrl).toBeDefined();
    expect(body.qrUrl).toBeDefined();
  });

  test('T1-F13-02: Remote cam session creation requires sessionId', async ({ request }) => {
    const response = await request.post('/api/grading/remote-session/create', {
      data: {
        // missing sessionId
        sessionName: 'Kỳ thi kiểm tra 1 tiết',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('T1-F13-03: Live poll creation creates interactive room', async ({ request }) => {
    const response = await request.post('/api/teach/live-poll/create', {
      data: {
        questionTitle: 'Đáp án câu 1 là gì?',
        options: ['A', 'B', 'C', 'D'],
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.roomCode).toBeDefined();
  });

  test('T1-F13-04: In-app feedback submission accepts valid report', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        category: 'bug_report',
        title: 'Giao diện hiển thị tốt',
        content: 'Hệ thống vận hành trơn tru và nhanh chóng.',
        email: 'teacher@test.edu.vn',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBeDefined();
  });

  test('T1-F13-05: In-app feedback rejects empty content', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        title: 'Không có nội dung',
        content: '',
      },
    });

    expect(response.status()).toBe(400);
  });
});
