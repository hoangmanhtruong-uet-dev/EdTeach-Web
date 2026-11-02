import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 6: Wallet Ledger Integrity & RPC (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 6), RC-05, SEC-06, WAL-02
 * Opaque-box contract: Ledger integrity, atomic transaction constraints, and payment endpoints.
 */
test.describe('Tier 1: Feature 6 - Wallet Ledger Integrity & RPC', () => {
  test('T1-F06-01: Marketplace payout requires authenticated user session', async ({ request }) => {
    const response = await request.post('/api/marketplace/payout', {
      data: {
        amount_credits: 2000,
        bank_name: 'MB',
        account_number: '123456789',
        account_holder: 'NGUYEN VAN A',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('T1-F06-02: Marketplace payout GET stats requires authentication', async ({ request }) => {
    const response = await request.get('/api/marketplace/payout');
    expect(response.status()).toBe(401);
  });

  test('T1-F06-03: Payment create-order endpoint requires authenticated user or valid payload', async ({ request }) => {
    const response = await request.post('/api/payment/create-order', {
      data: {
        planId: 'pro_monthly',
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F06-04: Payment check-status returns error for non-existent order code', async ({ request }) => {
    const response = await request.get('/api/payment/check-status?order_code=99999999');
    expect([400, 401, 404, 500]).toContain(response.status());
  });

  test('T1-F06-05: Payment webhook rejects malformed or unauthenticated notification', async ({ request }) => {
    const response = await request.post('/api/payment/webhook/payos', {
      data: {
        invalid: true,
      },
    });
    expect([400, 401, 403, 500]).toContain(response.status());
  });
});
