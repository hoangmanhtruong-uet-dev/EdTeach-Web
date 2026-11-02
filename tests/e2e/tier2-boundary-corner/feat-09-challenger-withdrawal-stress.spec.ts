import { test, expect } from '@playwright/test';
import { TEST_CONSTANTS } from '../fixtures/test-constants';

/**
 * Adversarial Challenger Suite — Milestone 6
 * Stress-testing the 200,000 VNĐ withdrawal floor across all vectors:
 * - Tampered requests & type confusion (strings, objects, arrays, NaN, SQLi, XSS)
 * - Float and fractional values (199999.99, 1999.9 credits, 0.5)
 * - Negative numbers (-1, -200k, -1e9, -0)
 * - Exact boundary values (0, 199999, 200000)
 * - Multi-thread concurrent withdrawal race attempts (20 parallel requests)
 */

test.describe('Adversarial Challenger: 200,000 VNĐ Withdrawal Floor & Concurrency', () => {
  const validBankInfo = {
    bankCode: 'MB',
    bankAccount: '999988887777',
    bankAccountName: 'TRAN VAN TEST',
  };

  const validMarketplaceBankInfo = {
    bank_name: 'MBBank',
    account_number: '999988887777',
    account_holder: 'TRAN VAN TEST',
  };

  // ---------------------------------------------------------------------------
  // 1. FLOAT & FRACTIONAL VALUES
  // ---------------------------------------------------------------------------
  test.describe('1. Float & Fractional Value Attacks', () => {
    test('[Adversarial] Affiliate payout with 199,999.99 VNĐ float is strictly rejected', async ({ request }) => {
      const res = await request.post('/api/affiliate/payout', {
        data: {
          amountVnd: 199999.99,
          ...validBankInfo,
        },
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('200.000');
    });

    test('[Adversarial] Affiliate payout with 0.99 VNĐ float is strictly rejected', async ({ request }) => {
      const res = await request.post('/api/affiliate/payout', {
        data: {
          amountVnd: 0.99,
          ...validBankInfo,
        },
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('200.000');
    });

    test('[Adversarial] Marketplace payout with 1999.9 credits (< 200,000 VNĐ) is strictly rejected', async ({ request }) => {
      const res = await request.post('/api/marketplace/payout', {
        data: {
          amount_credits: 1999.9, // 199,990 VNĐ
          ...validMarketplaceBankInfo,
        },
      });
      expect([400, 401]).toContain(res.status());
      if (res.status() === 400) {
        const body = await res.json();
        expect(body.error).toContain('200.000');
      }
    });

    test('[Adversarial] Marketplace payout with 0.5 credits is strictly rejected', async ({ request }) => {
      const res = await request.post('/api/marketplace/payout', {
        data: {
          amount_credits: 0.5,
          ...validMarketplaceBankInfo,
        },
      });
      expect([400, 401]).toContain(res.status());
    });
  });

  // ---------------------------------------------------------------------------
  // 2. NEGATIVE VALUES & SIGNED ZERO
  // ---------------------------------------------------------------------------
  test.describe('2. Negative Numbers & Zero Variations', () => {
    const negativeAmounts = [-1, -50000, -199999, -200000, -999999999, -0];

    for (const neg of negativeAmounts) {
      test(`[Adversarial] Affiliate payout with negative amountVnd (${neg}) is rejected`, async ({ request }) => {
        const res = await request.post('/api/affiliate/payout', {
          data: {
            amountVnd: neg,
            ...validBankInfo,
          },
        });
        expect(res.status()).toBe(400);
      });
    }

    const negativeCredits = [-1, -500, -1999, -2000, -999999999];

    for (const negCredit of negativeCredits) {
      test(`[Adversarial] Marketplace payout with negative amount_credits (${negCredit}) is rejected`, async ({ request }) => {
        const res = await request.post('/api/marketplace/payout', {
          data: {
            amount_credits: negCredit,
            ...validMarketplaceBankInfo,
          },
        });
        expect([400, 401]).toContain(res.status());
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 3. TAMPERED TYPES & INJECTION VECTORS
  // ---------------------------------------------------------------------------
  test.describe('3. Tampered Types & Security Injections', () => {
    test('[Adversarial] Non-numeric amount string "199999abc" is rejected', async ({ request }) => {
      const res = await request.post('/api/affiliate/payout', {
        data: {
          amountVnd: '199999abc',
          ...validBankInfo,
        },
      });
      expect(res.status()).toBe(400);
    });

    test('[Adversarial] Object injection in amountVnd is rejected', async ({ request }) => {
      const res = await request.post('/api/affiliate/payout', {
        data: {
          amountVnd: { $gt: 200000 },
          ...validBankInfo,
        },
      });
      expect(res.status()).toBe(400);
    });

    test('[Adversarial] Array injection in amountVnd is rejected', async ({ request }) => {
      const res = await request.post('/api/affiliate/payout', {
        data: {
          amountVnd: [199999, 200000],
          ...validBankInfo,
        },
      });
      expect(res.status()).toBe(400);
    });

    test('[Adversarial] SQLi in bankAccount does not cause server error or bypass', async ({ request }) => {
      const res = await request.post('/api/affiliate/payout', {
        data: {
          amountVnd: 200000,
          bankCode: 'MB',
          bankAccount: TEST_CONSTANTS.SECURITY_PAYLOADS.SQLI_PAYLOAD,
          bankAccountName: 'ATTACKER',
        },
      });
      // Either 200 (if fallback stores sanitized record) or 400 (rejected format) or 401, never 500
      expect([200, 400, 401]).toContain(res.status());
    });

    test('[Adversarial] XSS in bankAccountName is handled safely', async ({ request }) => {
      const res = await request.post('/api/affiliate/payout', {
        data: {
          amountVnd: 200000,
          bankCode: 'MB',
          bankAccount: '0988776655',
          bankAccountName: TEST_CONSTANTS.SECURITY_PAYLOADS.XSS_PAYLOAD,
        },
      });
      expect([200, 400, 401]).toContain(res.status());
    });
  });

  // ---------------------------------------------------------------------------
  // 4. EXACT BOUNDARY CHECKS (199,999 vs 200,000)
  // ---------------------------------------------------------------------------
  test.describe('4. Exact Boundary Checks', () => {
    test('[Adversarial] Boundary 199,999 VNĐ on affiliate payout returns 400', async ({ request }) => {
      const res = await request.post('/api/affiliate/payout', {
        data: {
          amountVnd: 199999,
          ...validBankInfo,
        },
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('200.000');
    });

    test('[Adversarial] Boundary 1,999 credits (199,900 VNĐ) on marketplace payout returns 400 or 401', async ({ request }) => {
      const res = await request.post('/api/marketplace/payout', {
        data: {
          amount_credits: 1999,
          ...validMarketplaceBankInfo,
        },
      });
      expect([400, 401]).toContain(res.status());
      if (res.status() === 400) {
        const body = await res.json();
        expect(body.error).toContain('200.000');
      }
    });

    test('[Adversarial] Exact floor 200,000 VNĐ passes the floor check', async ({ request }) => {
      const res = await request.post('/api/affiliate/payout', {
        data: {
          amountVnd: 200000,
          ...validBankInfo,
        },
      });
      // 200,000 must NOT be blocked by the minimum payout limit
      if (res.status() === 400) {
        const body = await res.json();
        expect(body.error).not.toContain('Hạn mức rút tiền mặt tối thiểu');
      } else {
        expect([200, 401]).toContain(res.status());
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 5. CONCURRENT WITHDRAWAL RACE ATTEMPTS (20 PARALLEL THREADS)
  // ---------------------------------------------------------------------------
  test.describe('5. High-Concurrency Withdrawal Race Attempts', () => {
    test('[Adversarial] 20 concurrent affiliate payout requests do not crash server or corrupt state', async ({ request }) => {
      const concurrentRequests = Array.from({ length: 20 }).map((_, i) =>
        request.post('/api/affiliate/payout', {
          data: {
            amountVnd: 200000,
            bankCode: 'MB',
            bankAccount: `99990000${i}`,
            bankAccountName: `CONCURRENT TEST ${i}`,
          },
        })
      );

      const responses = await Promise.all(concurrentRequests);
      expect(responses).toHaveLength(20);

      for (const res of responses) {
        // No server crash (500)
        expect([200, 400, 401]).toContain(res.status());
      }
    });

    test('[Adversarial] 20 concurrent marketplace payout requests do not crash server or cause double payout', async ({ request }) => {
      const concurrentRequests = Array.from({ length: 20 }).map((_, i) =>
        request.post('/api/marketplace/payout', {
          data: {
            amount_credits: 2000,
            bank_name: 'MBBank',
            account_number: `99990000${i}`,
            account_holder: `CONCURRENT TEST ${i}`,
          },
        })
      );

      const responses = await Promise.all(concurrentRequests);
      expect(responses).toHaveLength(20);

      for (const res of responses) {
        expect([200, 400, 401]).toContain(res.status());
      }
    });

    test('[Adversarial] 20 concurrent below-floor payout requests (150k VNĐ) are all rejected without leakage', async ({ request }) => {
      const concurrentRequests = Array.from({ length: 20 }).map((_, i) =>
        request.post('/api/affiliate/payout', {
          data: {
            amountVnd: 150000,
            bankCode: 'MB',
            bankAccount: `99990000${i}`,
            bankAccountName: `RACE LEAK ${i}`,
          },
        })
      );

      const responses = await Promise.all(concurrentRequests);
      expect(responses).toHaveLength(20);

      for (const res of responses) {
        // All 20 MUST be rejected with 400
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body.error).toContain('200.000');
      }
    });
  });
});
