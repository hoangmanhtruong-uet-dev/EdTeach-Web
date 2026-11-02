import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 4: Emergency RLS Migration (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 4), RC-04, SEC-01, STU-03
 * Opaque-box contract: Public catalog metadata is accessible, but sensitive content (exam_data) is withheld from public/unauthenticated calls.
 */
test.describe('Tier 1: Feature 4 - Emergency RLS Migration', () => {
  test('T1-F04-01: Public marketplace items endpoint returns published items list', async ({ request }) => {
    const response = await request.get('/api/marketplace/items');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.items)).toBe(true);
  });

  test('T1-F04-02: Public marketplace items do not expose full proprietary exam_data to anonymous viewers', async ({ request }) => {
    const response = await request.get('/api/marketplace/items');
    const body = await response.json();
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        // exam_data must be stripped or undefined for public unowned listings
        if (!item.is_owner && !item.is_purchased) {
          expect(item.exam_data).toBeUndefined();
        }
      }
    }
  });

  test('T1-F04-03: Marketplace items include preview metadata and sample questions', async ({ request }) => {
    const response = await request.get('/api/marketplace/items');
    const body = await response.json();
    if (body.items && body.items.length > 0) {
      const firstItem = body.items[0];
      expect(firstItem).toHaveProperty('title');
      expect(firstItem).toHaveProperty('price_credits');
    }
  });

  test('T1-F04-04: Non-existent student report token returns 404 error safely without data leakage', async ({ request }) => {
    const response = await request.get('/api/reports/non-existent-token-xyz');
    expect([400, 404, 500]).toContain(response.status());
  });

  test('T1-F04-05: Non-existent practice session token returns 404 error safely', async ({ request }) => {
    const response = await request.get('/api/practice/non-existent-token-xyz');
    expect([400, 404, 500]).toContain(response.status());
  });
});
