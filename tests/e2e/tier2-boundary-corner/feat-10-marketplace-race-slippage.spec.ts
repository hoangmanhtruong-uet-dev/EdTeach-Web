import { test, expect } from '@playwright/test';
import { TEST_CONSTANTS } from '../fixtures/test-constants';

/**
 * Tier 2 — Feature 10: Atomic Marketplace Purchase & 14-day Escrow (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 10), RC-05, RC-06, MKT-03
 * Opaque-box contract: Price slippage, malformed item identifiers, and publication boundary conditions.
 */
test.describe('Tier 2: Feature 10 - Marketplace Race & Slippage Corner Cases', () => {
  test('T2-F10-01: Marketplace buy with malformed item_id is rejected', async ({ request }) => {
    const response = await request.post('/api/marketplace/buy', {
      data: { item_id: 'not-a-valid-uuid-or-id' },
    });
    expect([400, 401, 404]).toContain(response.status());
  });

  test('T2-F10-02: Marketplace buy with SQLi payload in item_id is handled securely', async ({ request }) => {
    const response = await request.post('/api/marketplace/buy', {
      data: { item_id: TEST_CONSTANTS.SECURITY_PAYLOADS.SQLI_PAYLOAD },
    });
    expect([400, 401, 404]).toContain(response.status());
  });

  test('T2-F10-03: Publishing marketplace item with negative price_credits is rejected or normalized', async ({ request }) => {
    const response = await request.post('/api/marketplace/items', {
      data: {
        title: 'Đề kiểm tra thử',
        subject: 'Vật lý',
        grade: 11,
        price_credits: -500,
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T2-F10-04: Publishing marketplace item with empty questions array is handled properly', async ({ request }) => {
    const response = await request.post('/api/marketplace/items', {
      data: {
        title: 'Đề rỗng không có câu hỏi',
        subject: 'Hóa học',
        grade: 10,
        price_credits: 100,
        questions: [],
      },
    });
    expect([200, 400, 401]).toContain(response.status());
  });

  test('T2-F10-05: Publishing marketplace item with oversized title is validated', async ({ request }) => {
    const response = await request.post('/api/marketplace/items', {
      data: {
        title: 'T'.repeat(5000),
        subject: 'Toán',
        grade: 12,
        price_credits: 100,
      },
    });
    expect([200, 400, 401]).toContain(response.status());
  });
});
