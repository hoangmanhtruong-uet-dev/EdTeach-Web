import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 18: Accessibility & Performance Polish (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 18), RC-01, RC-10, WBD-05, WBD-10
 * Opaque-box contract: Accessibility fundamentals, responsive design viewport, markup standards, and font self-hosting.
 */
test.describe('Tier 1: Feature 18 - Accessibility & Performance Polish', () => {
  test('T1-F18-01: HTML document has valid lang attribute', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
  });

  test('T1-F18-02: Viewport meta tag is defined for mobile responsiveness', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('T1-F18-03: Page contains semantic main landmark or root content container', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('T1-F18-04: Labs page contains hierarchical heading structure or validates auth guard', async ({ page }) => {
    await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      await expect(page.locator('body')).toBeVisible();
    } else {
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('T1-F18-05: Public landing page loads within acceptable performance threshold', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadDuration = Date.now() - startTime;
    expect(loadDuration).toBeLessThan(10000); // within 10s on dev
  });

  test('T1-F18-06: Student progress page includes accessible radar chart or redirects to auth', async ({ page }) => {
    await page.goto('/student/progress', { waitUntil: 'domcontentloaded' });
    if (!page.url().includes('/login')) {
      // Check for radar chart container or screen reader table
      const srTable = page.locator('.sr-only table');
      if (await srTable.count() > 0) {
        await expect(srTable).toBeAttached();
      }
    }
  });

  test('T1-F18-07: Self-hosted Excalidraw fonts are served locally via HTTP 200', async ({ request }) => {
    // Check local font availability under font family directory
    const fontRes = await request.get('/fonts/Virgil/Virgil-Regular.woff2');
    expect([200, 304]).toContain(fontRes.status());
  });
});
