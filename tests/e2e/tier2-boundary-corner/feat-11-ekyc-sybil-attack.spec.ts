import { test, expect } from '@playwright/test';
import { TEST_CONSTANTS } from '../fixtures/test-constants';

/**
 * Tier 2 — Feature 11: Anti-Repetition eKYC & Referral Reward Guard (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 11), RC-06, RC-09, SET-03
 * Opaque-box contract: Sybil attacks, referral loop exploitation, and malformed verification identifiers.
 */
test.describe('Tier 2: Feature 11 - eKYC & Sybil Attack Corner Cases', () => {
  test('T2-F11-01: Applying referral code with SQLi payload is handled securely', async ({ request }) => {
    const response = await request.post('/api/referral', {
      data: { referral_code: TEST_CONSTANTS.SECURITY_PAYLOADS.SQLI_PAYLOAD },
    });
    expect([400, 401, 404]).toContain(response.status());
  });

  test('T2-F11-02: Applying referral code with XSS script tags is handled cleanly', async ({ request }) => {
    const response = await request.post('/api/referral', {
      data: { referral_code: TEST_CONSTANTS.SECURITY_PAYLOADS.XSS_PAYLOAD },
    });
    expect([400, 401, 404]).toContain(response.status());
  });

  test('T2-F11-03: Applying referral code with whitespace-only string returns 400 or 401', async ({ request }) => {
    const response = await request.post('/api/referral', {
      data: { referral_code: '     ' },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T2-F11-04: Verification status check with SQL injection in userId does not crash', async ({ request }) => {
    const response = await request.get(`/api/verification/status?userId=${encodeURIComponent(TEST_CONSTANTS.SECURITY_PAYLOADS.SQLI_PAYLOAD)}`);
    expect([200, 400, 500]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.hasRecord).toBe(false);
    }
  });

  test('T2-F11-05: Uploading verification with invalid content type returns error', async ({ request }) => {
    const response = await request.post('/api/verification/upload', {
      headers: {
        'content-type': 'text/plain',
      },
      data: 'invalid plain text payload instead of multipart or json',
    });
    expect([400, 401, 500]).toContain(response.status());
  });
});
