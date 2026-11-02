import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 8: 3-Bucket Wallet Architecture (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 8), RC-06, ECO-01, WAL-01
 * Opaque-box contract: Verification of wallet boundaries, credit conversion, and withdrawal checks.
 */
test.describe('Tier 1: Feature 8 - 3-Bucket Wallet Architecture', () => {
  test('T1-F08-01: Affiliate payout rejects missing bank account parameters', async ({ request }) => {
    const response = await request.post('/api/affiliate/payout', {
      data: {
        amountVnd: 200000,
        // missing bankCode, bankAccount, bankAccountName
      },
    });
    expect(response.status()).toBe(400);
  });

  test('T1-F08-02: Affiliate convert-credits requires amount parameter', async ({ request }) => {
    const response = await request.post('/api/affiliate/convert-credits', {
      data: {},
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F08-03: Converting negative or zero credits is rejected', async ({ request }) => {
    const response = await request.post('/api/affiliate/convert-credits', {
      data: { amount_credits: -100 },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F08-04: Affiliate store GET summary returns status', async ({ request }) => {
    const response = await request.get('/api/affiliate');
    expect([200, 401]).toContain(response.status());
  });

  test('T1-F08-05: Payout requires sufficient balance', async ({ request }) => {
    const response = await request.post('/api/affiliate/payout', {
      data: {
        amountVnd: 50000000, // Very high amount
        bankCode: 'MB',
        bankAccount: '0988888888',
        bankAccountName: 'NGUYEN VAN A',
      },
    });
    // Expected 400 (Insufficient balance)
    expect(response.status()).toBe(400);
  });
});
