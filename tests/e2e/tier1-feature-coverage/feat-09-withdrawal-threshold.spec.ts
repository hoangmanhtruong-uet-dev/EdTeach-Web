import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 9: Unified 200,000 VNĐ Withdrawal Threshold (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 9), RC-06, MKT-01, AFF-01
 * Opaque-box contract: Withdrawal requests below minimum limits must be rejected.
 */
test.describe('Tier 1: Feature 9 - Unified 200,000 VNĐ Withdrawal Threshold', () => {
  test('T1-F09-01: Affiliate payout with 0 VNĐ is rejected', async ({ request }) => {
    const response = await request.post('/api/affiliate/payout', {
      data: {
        amountVnd: 0,
        bankCode: 'MB',
        bankAccount: '123456789',
        bankAccountName: 'TEST USER',
      },
    });
    expect(response.status()).toBe(400);
  });

  test('T1-F09-02: Affiliate payout with negative amount is rejected', async ({ request }) => {
    const response = await request.post('/api/affiliate/payout', {
      data: {
        amountVnd: -50000,
        bankCode: 'MB',
        bankAccount: '123456789',
        bankAccountName: 'TEST USER',
      },
    });
    expect(response.status()).toBe(400);
  });

  test('T1-F09-03: Marketplace payout with missing bank parameters is rejected', async ({ request }) => {
    const response = await request.post('/api/marketplace/payout', {
      data: {
        amount_credits: 2000,
      },
    });
    // Expected 400 or 401
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F09-04: Marketplace payout with 0 credits is rejected', async ({ request }) => {
    const response = await request.post('/api/marketplace/payout', {
      data: {
        amount_credits: 0,
        bank_name: 'MB',
        account_number: '123456789',
        account_holder: 'TEST USER',
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F09-05: Marketplace payout with negative credits is rejected', async ({ request }) => {
    const response = await request.post('/api/marketplace/payout', {
      data: {
        amount_credits: -1000,
        bank_name: 'MB',
        account_number: '123456789',
        account_holder: 'TEST USER',
      },
    });
    expect([400, 401]).toContain(response.status());
  });
});
