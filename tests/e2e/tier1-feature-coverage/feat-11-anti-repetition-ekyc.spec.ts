import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 11: Anti-Repetition eKYC & Referral Reward Guard (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 11), RC-06, RC-09, SET-03
 * Opaque-box contract: Validation of eKYC verification and anti-abuse checks on referral program.
 */
test.describe('Tier 1: Feature 11 - Anti-Repetition eKYC & Referral Reward Guard', () => {
  test('T1-F11-01: Verification status check requires userId parameter', async ({ request }) => {
    const response = await request.get('/api/verification/status');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('T1-F11-02: Verification status check returns valid unverified structure for new user', async ({ request }) => {
    const response = await request.get('/api/verification/status?userId=new-user-12345');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body).toHaveProperty('status');
  });

  test('T1-F11-03: Submitting referral code requires authenticated user', async ({ request }) => {
    const response = await request.post('/api/referral', {
      data: { referral_code: 'EDU99999' },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F11-04: Submitting empty referral code is rejected', async ({ request }) => {
    const response = await request.post('/api/referral', {
      data: { referral_code: '' },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F11-05: Verification upload endpoint requires file data', async ({ request }) => {
    const response = await request.post('/api/verification/upload', {
      data: {},
    });
    expect([400, 401, 500]).toContain(response.status());
  });
});
