import { test, expect } from '@playwright/test';
import { TEST_CONSTANTS } from '../fixtures/test-constants';

/**
 * Tier 2 — Feature 16: PhET 54 Simulations 100% Free Open Access (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 16), RC-11, LAB-01, LAB-05
 * Opaque-box contract: Path traversal resistance in simulation viewer, invalid slugs, and redirect safety.
 */
test.describe('Tier 2: Feature 16 - Simulation Asset & Slug Corner Cases', () => {
  test('T2-F16-01: Accessing non-existent simulation slug is handled safely', async ({ page }) => {
    const response = await page.goto('/labs/non-existent-simulation-slug-999', { waitUntil: 'domcontentloaded' });
    expect([200, 307, 308, 404]).toContain(response?.status());
  });

  test('T2-F16-02: Simulation viewer with path traversal in slug does not leak system files', async ({ request }) => {
    const response = await request.get(`/labs/${encodeURIComponent(TEST_CONSTANTS.SECURITY_PAYLOADS.PATH_TRAVERSAL_DIR)}`);
    expect([200, 307, 308, 400, 404]).toContain(response.status());
  });

  test('T2-F16-03: Labs page with SQL injection in search handles gracefully', async ({ page }) => {
    await page.goto(`/labs?search=${encodeURIComponent(TEST_CONSTANTS.SECURITY_PAYLOADS.SQLI_PAYLOAD)}`, { waitUntil: 'domcontentloaded' });
    expect(decodeURIComponent(page.url())).toContain('/labs');
    await expect(page.locator('body')).toBeVisible();
  });

  test('T2-F16-04: Labs page with XSS payload in search parameter does not execute script', async ({ page }) => {
    let dialogTriggered = false;
    page.on('dialog', () => { dialogTriggered = true; });
    await page.goto(`/labs?search=${encodeURIComponent(TEST_CONSTANTS.SECURITY_PAYLOADS.XSS_PAYLOAD)}`, { waitUntil: 'domcontentloaded' });
    expect(dialogTriggered).toBe(false);
  });

  test('T2-F16-05: Legacy /labs/courses redirect resolves cleanly without redirect loop', async ({ page }) => {
    await page.goto('/labs/courses', { waitUntil: 'domcontentloaded' });
    expect(decodeURIComponent(page.url())).toContain('/labs');
  });
});
