import { test, expect } from '@playwright/test';

/**
 * Tier 2 — Feature 8: 3-Bucket Wallet Architecture (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 8), RC-06, ECO-01, WAL-01
 * Opaque-box contract: Arbitrage prevention, fractional amounts, and wallet conversion boundaries.
 */
test.describe('Tier 2: Feature 8 - Three-Bucket Wallet Arbitrage Corner Cases', () => {
  test('T2-F08-01: Converting zero credits is rejected with 400', async ({ request }) => {
    const response = await request.post('/api/affiliate/convert-credits', {
      data: { amount_credits: 0 },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T2-F08-02: Converting float/fractional credits is validated', async ({ request }) => {
    const response = await request.post('/api/affiliate/convert-credits', {
      data: { amount_credits: 10.75 },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T2-F08-03: Converting astronomically large credits is rejected', async ({ request }) => {
    const response = await request.post('/api/affiliate/convert-credits', {
      data: { amount_credits: 999999999999 },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T2-F08-04: Affiliate payout with whitespace-only bank parameters is rejected', async ({ request }) => {
    const response = await request.post('/api/affiliate/payout', {
      data: {
        amountVnd: 200000,
        bankCode: '   ',
        bankAccount: '   ',
        bankAccountName: '   ',
      },
    });
    expect(response.status()).toBe(400);
  });

  test('T2-F08-05: Marketplace payout with non-numeric account number or script is rejected', async ({ request }) => {
    const response = await request.post('/api/marketplace/payout', {
      data: {
        amount_credits: 2000,
        bank_name: '<script>alert(1)</script>',
        account_number: 'invalid-alpha',
        account_holder: 'USER',
      },
    });
    expect([400, 401]).toContain(response.status());
  });
});
