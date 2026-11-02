import { test, expect } from '@playwright/test';

/**
 * Empirical Challenger Stress Harness — Deep Financial Boundaries & Negative Limits
 * Probing negative amounts, non-numeric values, NaN, null, and object injection for payouts.
 */
test.describe('Challenger Stress — Deep Financial Boundary Limits', () => {
  const invalidAmounts = [-1, -200000, 0, null, 'invalid_number', NaN, 199999.99];

  for (const amount of invalidAmounts) {
    test(`[Challenger] Affiliate payout with amount ${String(amount)} is rejected with 400`, async ({ request }) => {
      const response = await request.post('/api/affiliate/payout', {
        data: {
          amountVnd: amount,
          bankCode: 'MB',
          bankAccount: '0988888888',
          bankAccountName: 'NGUYEN VAN A',
        },
      });
      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(json.error).toBeDefined();
    });

    test(`[Challenger] Marketplace payout with amount ${String(amount)} is rejected with 400 or 401`, async ({ request }) => {
      const response = await request.post('/api/marketplace/payout', {
        data: {
          amount_vnd: amount,
          bank_name: 'MB',
          account_number: '0988888888',
          account_holder: 'NGUYEN VAN A',
        },
      });
      expect([400, 401]).toContain(response.status());
      const json = await response.json();
      expect(json.error).toBeDefined();
    });
  }
});
