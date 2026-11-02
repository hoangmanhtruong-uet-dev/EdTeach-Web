import { test, expect } from '@playwright/test';
import { assertRedirectsToLogin, getWithoutRedirect } from '../fixtures/api-helpers';

/**
 * Tier 1 — Feature 1: Middleware Route Matcher & Auth Guard (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 1), RC-01, SEC-05, STU-01
 * Opaque-box contract: Unauthenticated requests to protected routes must be redirected to /login.
 */
test.describe('Tier 1: Feature 1 - Middleware Route Matcher & Auth Guard', () => {
  test('T1-F01-01: Unauthenticated request to /dashboard redirects to /login', async ({ request }) => {
    await assertRedirectsToLogin(request, '/dashboard');
  });

  test('T1-F01-02: Unauthenticated request to /wallet redirects to /login', async ({ request }) => {
    await assertRedirectsToLogin(request, '/wallet');
  });

  test('T1-F01-03: Unauthenticated request to /settings redirects to /login', async ({ request }) => {
    await assertRedirectsToLogin(request, '/settings');
  });

  test('T1-F01-04: Unauthenticated request to /teach redirects to /login', async ({ request }) => {
    await assertRedirectsToLogin(request, '/teach');
  });

  test('T1-F01-05: Unauthenticated request to /grading redirects to /login', async ({ request }) => {
    await assertRedirectsToLogin(request, '/grading');
  });
});
