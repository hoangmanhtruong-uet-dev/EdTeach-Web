import { test, expect } from '@playwright/test';

/**
 * Tier 2 — Feature 9: Unified 200,000 VNĐ Withdrawal Threshold (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 9), RC-06, MKT-01, AFF-01
 * Opaque-box contract: Boundary Value Analysis (BVA) for payout amounts below 200.000 VNĐ floor.
 */
test.describe('Tier 2: Feature 9 - Payout Boundary Limits (200k Floor BVA)', () => {
  test('T2-F09-01: Affiliate payout with 50,000 VNĐ is rejected (< 200,000 VNĐ)', async ({ request }) => {
    const response = await request.post('/api/affiliate/payout', {
      data: {
        amountVnd: 50000,
        bankCode: 'MB',
        bankAccount: '0988888888',
        bankAccountName: 'NGUYEN VAN A',
      },
    });
    expect(response.status()).toBe(400);
  });

  test('T2-F09-02: Affiliate payout with 100,000 VNĐ is rejected (< 200,000 VNĐ)', async ({ request }) => {
    const response = await request.post('/api/affiliate/payout', {
      data: {
        amountVnd: 100000,
        bankCode: 'MB',
        bankAccount: '0988888888',
        bankAccountName: 'NGUYEN VAN A',
      },
    });
    // In unified 200k threshold, 100.000 must be rejected
    expect(response.status()).toBe(400);
  });

  test('T2-F09-03: Affiliate payout with 150,000 VNĐ is rejected (< 200,000 VNĐ)', async ({ request }) => {
    const response = await request.post('/api/affiliate/payout', {
      data: {
        amountVnd: 150000,
        bankCode: 'MB',
        bankAccount: '0988888888',
        bankAccountName: 'NGUYEN VAN A',
      },
    });
    expect(response.status()).toBe(400);
  });

  test('T2-F09-04: Affiliate payout with 199,999 VNĐ boundary is rejected (< 200,000 VNĐ)', async ({ request }) => {
    const response = await request.post('/api/affiliate/payout', {
      data: {
        amountVnd: 199999,
        bankCode: 'MB',
        bankAccount: '0988888888',
        bankAccountName: 'NGUYEN VAN A',
      },
    });
    expect(response.status()).toBe(400);
  });

  test('T2-F09-05: Marketplace payout with 500 credits (50.000 VNĐ) is rejected (< 200,000 VNĐ)', async ({ request }) => {
    const response = await request.post('/api/marketplace/payout', {
      data: {
        amount_credits: 500, // equivalent to 50,000 VNĐ
        bank_name: 'MB',
        account_number: '0988888888',
        account_holder: 'NGUYEN VAN A',
      },
    });
    expect([400, 401]).toContain(response.status());
  });
});
