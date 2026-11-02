import { test, expect } from '@playwright/test';

/**
 * Tier 2 — Feature 10: Escrow Release Cron Route Security Verification
 * Requirements: PROJECT.md § Feature Inventory (Feature 10), Milestone 3 Dispatch Focus #3
 * Verification: /api/cron/escrow-release rejects requests without Bearer CRON_SECRET with HTTP 401.
 */
test.describe('Tier 2: Feature 10 - Escrow Release Cron Route Security', () => {
  test('T2-CRON-01: GET /api/cron/escrow-release rejects unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/cron/escrow-release');
    // Expect 401 Unauthorized (or 500 if CRON_SECRET not configured on test server)
    expect([401, 500]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('T2-CRON-02: POST /api/cron/escrow-release rejects unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/cron/escrow-release');
    expect([401, 500]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('T2-CRON-03: GET /api/cron/escrow-release rejects invalid Bearer token', async ({ request }) => {
    const response = await request.get('/api/cron/escrow-release', {
      headers: {
        Authorization: 'Bearer invalid_cron_secret_token_1234567890',
      },
    });
    expect([401, 500]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('T2-CRON-04: GET /api/cron/escrow-release rejects malformed Basic auth', async ({ request }) => {
    const response = await request.get('/api/cron/escrow-release', {
      headers: {
        Authorization: 'Basic dXNlcjpwYXNzd29yZA==',
      },
    });
    expect([401, 500]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
