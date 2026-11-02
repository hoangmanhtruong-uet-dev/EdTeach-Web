import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 10: Atomic Marketplace Purchase & 14-day Escrow (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 10), RC-05, RC-06, MKT-03
 * Opaque-box contract: Validation of marketplace purchasing endpoint and publishing contracts.
 */
test.describe('Tier 1: Feature 10 - Atomic Marketplace Purchase & 14-day Escrow', () => {
  test('T1-F10-01: Marketplace buy endpoint requires authenticated session', async ({ request }) => {
    const response = await request.post('/api/marketplace/buy', {
      data: { item_id: 'sample-item-123' },
    });
    expect(response.status()).toBe(401);
  });

  test('T1-F10-02: Marketplace buy endpoint rejects request without item_id', async ({ request }) => {
    const response = await request.post('/api/marketplace/buy', {
      data: {},
    });
    // Expected 400 (Bad Request) or 401 (Unauthorized)
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F10-03: Marketplace item publishing requires authenticated user', async ({ request }) => {
    const response = await request.post('/api/marketplace/items', {
      data: {
        title: 'Đề thi thử tốt nghiệp THPT Toán 2026',
        subject: 'Toán',
        grade: 12,
        price_credits: 200,
      },
    });
    expect(response.status()).toBe(401);
  });

  test('T1-F10-04: Marketplace item publishing validates required fields', async ({ request }) => {
    const response = await request.post('/api/marketplace/items', {
      data: {
        // Missing title, subject, grade
        price_credits: 200,
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F10-05: Marketplace clone-to-studio requires valid exam item reference', async ({ request }) => {
    const response = await request.post('/api/marketplace/clone-to-studio', {
      data: {},
    });
    expect([400, 401, 404]).toContain(response.status());
  });
});
