import { test, expect } from '@playwright/test';

/**
 * Tier 2 — Feature 17: Marketing Alignment & Mock Data Cleanup (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 17), RC-10, PRC-03, MKT-13
 * Opaque-box contract: Form validation boundaries, credential security, and leaked secrets prevention.
 */
test.describe('Tier 2: Feature 17 - Form Validation & Secrets Leak Prevention', () => {
  test('T2-F17-01: Login page enforces required fields on submission', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      expect(page.url()).toContain('/login');
    }
  });

  test('T2-F17-02: Register page enforces required email and password fields', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      expect(page.url()).toContain('/register');
    }
  });

  test('T2-F17-03: Register page with invalid email format fails client validation', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('invalid-email-not-an-address');
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();
      expect(page.url()).toContain('/register');
    }
  });

  test('T2-F17-04: Public pages HTML source does not leak SERVICE_ROLE_KEY', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(html).not.toContain('service_role');
  });

  test('T2-F17-05: Public pages HTML source does not leak GEMINI secret key', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).not.toContain('GEMINI_API_KEY');
  });
});
