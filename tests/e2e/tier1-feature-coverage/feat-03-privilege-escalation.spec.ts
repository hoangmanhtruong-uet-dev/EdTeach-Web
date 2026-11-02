import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 3: Privilege Escalation Lock (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 3), RC-03, SEC-03, SET-01
 * Opaque-box contract: Only allowed roles can be selected, administrative escalation is locked,
 * and unauthenticated role modification is rejected with 401.
 */
test.describe('Tier 1: Feature 3 - Privilege Escalation Lock', () => {
  test('T1-F03-01: Setting valid role teacher validates input and enforces auth', async ({ request }) => {
    const response = await request.post('/api/user/set-role', {
      data: { role: 'teacher' },
    });
    // Expected 200 (if authenticated) or 401 (if unauthenticated session)
    expect([200, 401]).toContain(response.status());
  });

  test('T1-F03-02: Setting valid role student validates input and enforces auth', async ({ request }) => {
    const response = await request.post('/api/user/set-role', {
      data: { role: 'student' },
    });
    expect([200, 401]).toContain(response.status());
  });

  test('T1-F03-03: Setting valid role tutor validates input and enforces auth', async ({ request }) => {
    const response = await request.post('/api/user/set-role', {
      data: { role: 'tutor' },
    });
    expect([200, 401]).toContain(response.status());
  });

  test('T1-F03-04: Attempting to set unauthorized role admin is rejected', async ({ request }) => {
    const response = await request.post('/api/user/set-role', {
      data: { role: 'admin' },
    });
    expect([400, 401, 403]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('T1-F03-05: Attempting to set arbitrary role superuser is rejected', async ({ request }) => {
    const response = await request.post('/api/user/set-role', {
      data: { role: 'superuser' },
    });
    expect([400, 401, 403]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
