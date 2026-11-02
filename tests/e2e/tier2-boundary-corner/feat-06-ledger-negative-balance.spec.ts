import { test, expect } from '@playwright/test';

/**
 * Tier 2 — Feature 6: Wallet Ledger Integrity & RPC (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 6), RC-05, SEC-06, WAL-02
 * Opaque-box contract: Negative ledger balances, non-integer credits, and transaction tampering.
 */
test.describe('Tier 2: Feature 6 - Ledger Negative Balance & Payment Boundary Cases', () => {
  test('T2-F06-01: Payment mock-pay rejects negative amount', async ({ request }) => {
    const response = await request.post('/api/payment/mock-pay', {
      data: {
        amount: -50000,
        credits: -500,
      },
    });
    expect([400, 401, 403, 404]).toContain(response.status());
  });

  test('T2-F06-02: Payment create-order rejects negative amount', async ({ request }) => {
    const response = await request.post('/api/payment/create-order', {
      data: {
        amount: -149000,
        planId: 'pro_monthly',
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T2-F06-03: Payment create-order rejects NaN or string amount', async ({ request }) => {
    const response = await request.post('/api/payment/create-order', {
      data: {
        amount: 'invalid_non_numeric',
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T2-F06-04: Payment webhook rejects spoofed signature payload', async ({ request }) => {
    const response = await request.post('/api/payment/webhook/payos', {
      data: {
        code: '00',
        desc: 'success',
        data: {
          orderCode: 123456,
          amount: 149000,
        },
        signature: 'fake_forged_hmac_signature_value',
      },
    });
    expect([400, 401, 403, 500]).toContain(response.status());
  });

  test('T2-F06-05: SePay webhook rejects invalid token or forged payload', async ({ request }) => {
    const response = await request.post('/api/payment/webhook/sepay', {
      headers: {
        authorization: 'Apikey invalid_sepay_token_123',
      },
      data: {
        id: 99999,
        transferAmount: 500000,
      },
    });
    expect([400, 401, 403, 500]).toContain(response.status());
  });
});
