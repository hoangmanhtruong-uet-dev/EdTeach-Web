import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 2: Admin Route Hardening (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 2), RC-02, SEC-02, AFF-04
 * Opaque-box contract: Admin endpoints require active authentication and administrative privileges.
 */
test.describe('Tier 1: Feature 2 - Admin Route Hardening', () => {
  test('T1-F02-01: Admin affiliate endpoint requires authenticated admin user', async ({ request }) => {
    const response = await request.get('/api/admin/affiliate');
    // Hardened admin route must not allow unauthenticated access (must be 401 or 403)
    expect([401, 403]).toContain(response.status());
  });

  test('T1-F02-02: Admin verifications endpoint requires authenticated admin user', async ({ request }) => {
    const response = await request.get('/api/admin/verifications');
    // Hardened verifications endpoint must deny access to unauthenticated requests
    expect([401, 403]).toContain(response.status());
  });

  test('T1-F02-03: Unauthenticated caller cannot approve admin verifications', async ({ request }) => {
    const response = await request.post('/api/admin/verifications', {
      data: {
        recordId: 'test-rec-1',
        action: 'approved',
      },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('T1-F02-04: Unauthenticated caller cannot process affiliate payouts', async ({ request }) => {
    const response = await request.post('/api/admin/affiliate', {
      data: {
        payoutId: 'payout-test-1',
        action: 'approve',
      },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('T1-F02-05: Admin dashboard page is protected and redirects unauthenticated users', async ({ request }) => {
    const response = await request.get('/admin', { maxRedirects: 0 });
    expect([301, 302, 307, 308, 401, 403, 404]).toContain(response.status());
  });
});
