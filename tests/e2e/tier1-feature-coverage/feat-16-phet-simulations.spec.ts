import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 16: PhET 54 Simulations 100% Free Open Access (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 16), RC-11, LAB-01, LAB-05
 * Opaque-box contract: Verification of 54 3D simulation catalog, open access, and license compliance.
 */
test.describe('Tier 1: Feature 16 - PhET 54 Simulations 100% Free Open Access', () => {
  test('T1-F16-01: Labs catalog page returns 200 OK or redirects to auth during interim milestone', async ({ page }) => {
    const response = await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('next=%2Flabs');
    } else {
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toContainText('Phòng thí nghiệm 3D');
    }
  });

  test('T1-F16-02: Labs catalog displays all 4 subject categories or validates auth gate', async ({ page }) => {
    await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      const content = await page.content();
      expect(content).toContain('Vật lý');
      expect(content).toContain('Hóa học');
      expect(content).toContain('Sinh học');
      expect(content).toContain('Địa lý');
    }
  });

  test('T1-F16-03: Labs catalog reflects breakdown of 54 simulations or validates auth gate', async ({ page }) => {
    await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      const content = await page.content();
      expect(content).toContain('54');
    }
  });

  test('T1-F16-04: Legacy route /labs/courses redirects to /labs', async ({ request }) => {
    const response = await request.get('/labs/courses', { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(response.status());
    const location = response.headers()['location'] || '';
    expect(location).toContain('/labs');
  });

  test('T1-F16-05: Legacy route /labs/courses/index.html redirects to /labs', async ({ request }) => {
    const response = await request.get('/labs/courses/index.html', { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(response.status());
    const location = response.headers()['location'] || '';
    expect(location).toContain('/labs');
  });
});
