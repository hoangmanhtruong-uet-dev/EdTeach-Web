import { test, expect } from '@playwright/test';

/**
 * Adversarial Bypass Test Suite — Challenger M1.1
 * Stress-testing PR 0.1 and PR 0.2 implementations against bypasses and tampering.
 */

test.describe('Adversarial Bypass & Privilege Hardening (Milestone 1)', () => {
  // ---------------------------------------------------------------------------
  // 1. MIDDLEWARE URL PERMUTATIONS & BYPASS HEADERS
  // ---------------------------------------------------------------------------
  const protectedRoutes = [
    '/student',
    '/student/exams',
    '/labs/physics',
    '/marketplace',
    '/whiteboard/123',
    '/admin/affiliate',
    '/admin/verifications',
    '/teach/123',
    '/wallet',
    '/settings',
  ];

  for (const route of protectedRoutes) {
    test(`[Adversarial] Unauthenticated request to ${route} strictly redirects to /login`, async ({ request }) => {
      const response = await request.get(route, { maxRedirects: 0 });
      expect([301, 302, 307, 308]).toContain(response.status());
      const location = response.headers()['location'] || '';
      expect(location).toContain('/login?redirectTo=');
    });

    test(`[Adversarial] x-playwright-audit bypass header on ${route} is ignored`, async ({ request }) => {
      const response = await request.get(route, {
        headers: {
          'x-playwright-audit': 'true',
          'X-Playwright-Audit': 'true',
        },
        maxRedirects: 0,
      });
      expect([301, 302, 307, 308]).toContain(response.status());
      const location = response.headers()['location'] || '';
      expect(location).toContain('/login');
    });

    test(`[Adversarial] ?audit=true query parameter on ${route} is ignored`, async ({ request }) => {
      const response = await request.get(`${route}?audit=true&mode=bypass`, { maxRedirects: 0 });
      expect([301, 302, 307, 308]).toContain(response.status());
      const location = response.headers()['location'] || '';
      expect(location).toContain('/login');
    });
  }

  // ---------------------------------------------------------------------------
  // 2. COOKIE & LOCALSTORAGE AUDIT BYPASS ON PAGES
  // ---------------------------------------------------------------------------
  test('[Adversarial] Whiteboard /whiteboard/123 with audit=true cookie does NOT show mock board without auth', async ({ page }) => {
    // Set audit cookie
    await page.context().addCookies([
      {
        name: 'audit',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/whiteboard/123');
    // Must redirect to login page
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  // ---------------------------------------------------------------------------
  // 3. ADMIN API BYPASS ATTACKS
  // ---------------------------------------------------------------------------
  test('[Adversarial] /api/admin/affiliate with no session returns 403', async ({ request }) => {
    const res = await request.get('/api/admin/affiliate');
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Bạn không có quyền');
  });

  test('[Adversarial] /api/admin/affiliate with invalid bearer token returns 403', async ({ request }) => {
    const res = await request.get('/api/admin/affiliate', {
      headers: {
        Authorization: 'Bearer invalid-token-12345',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('[Adversarial] /api/admin/verifications with no session returns 403', async ({ request }) => {
    const res = await request.get('/api/admin/verifications');
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Bạn không có quyền');
  });

  test('[Adversarial] /api/admin/verifications POST with client-supplied adminUserId="admin_super" is denied', async ({ request }) => {
    const res = await request.post('/api/admin/verifications', {
      data: {
        recordId: 'rec-test-123',
        action: 'approved',
        adminUserId: 'admin_super', // Spoofed admin user ID
      },
    });
    expect(res.status()).toBe(403);
  });

  // ---------------------------------------------------------------------------
  // 4. USER SET-ROLE ATTACKS
  // ---------------------------------------------------------------------------
  test('[Adversarial] /api/user/set-role with no session returns 401', async ({ request }) => {
    const res = await request.post('/api/user/set-role', {
      data: { role: 'teacher' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('[Adversarial] /api/user/set-role attempting to set role to "admin" returns 400 or 401', async ({ request }) => {
    const res = await request.post('/api/user/set-role', {
      data: { role: 'admin' },
    });
    // Unauthenticated -> 401; Authenticated -> 400 (not in allowed list)
    expect([400, 401]).toContain(res.status());
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('[Adversarial] /api/user/set-role with SQL injection / arbitrary roles returns 400 or 401', async ({ request }) => {
    const payloads = ["' OR '1'='1", 'superadmin', 'tutor; DROP TABLE users;', null];
    for (const p of payloads) {
      const res = await request.post('/api/user/set-role', {
        data: { role: p },
      });
      expect([400, 401]).toContain(res.status());
      const body = await res.json();
      expect(body.success).toBe(false);
    }
  });
});
