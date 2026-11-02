import { test, expect } from '@playwright/test';
import { assertRedirectsToLogin, getWithoutRedirect } from '../fixtures/api-helpers';
import { TEST_CONSTANTS } from '../fixtures/test-constants';

/**
 * Tier 2 — Feature 1: Middleware Route Matcher & Auth Guard (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 1), RC-01, SEC-05, STU-01
 * Opaque-box contract: Bypass headers and query parameters MUST be denied; unauthenticated routes strictly protected.
 */
test.describe('Tier 2: Feature 1 - Middleware Bypass Corner Cases', () => {
  test('T2-F01-01: Bypass attempt using x-playwright-audit: true header must be denied', async ({ request }) => {
    // Audit bypass header must be ignored; unauthenticated user must still be redirected to /login
    await assertRedirectsToLogin(request, '/dashboard', TEST_CONSTANTS.SECURITY_PAYLOADS.AUDIT_HEADER);
  });

  test('T2-F01-02: Bypass attempt using ?audit=true query parameter must be denied', async ({ request }) => {
    await assertRedirectsToLogin(request, `/dashboard${TEST_CONSTANTS.SECURITY_PAYLOADS.AUDIT_QUERY}`);
  });

  test('T2-F01-03: Bypass attempt using ?role=admin query parameter must be denied', async ({ request }) => {
    await assertRedirectsToLogin(request, '/dashboard?role=admin');
  });

  test('T2-F01-04: Path traversal attempt /dashboard/../admin is handled securely', async ({ request }) => {
    const response = await getWithoutRedirect(request, '/dashboard/../admin');
    // Must either redirect to login or return 401/403/404, never 200 without auth
    expect([301, 302, 307, 308, 401, 403, 404]).toContain(response.status());
  });

  test('T2-F01-05: Unauthenticated access to /student routes is protected and redirected', async ({ request }) => {
    // In hardened matcher, /student/:path* is matched and redirected
    const response = await getWithoutRedirect(request, '/student/exams');
    expect([301, 302, 307, 308, 401, 403]).toContain(response.status());
  });
});
