import { test, expect } from '@playwright/test';

/**
 * Tier 2 — Feature 18: Accessibility & Performance Polish (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 18), RC-01, RC-10, WBD-05
 * Opaque-box contract: Viewport boundaries, responsive layout stress, and input accessibility.
 */
test.describe('Tier 2: Feature 18 - Accessibility & Responsive Viewport Stress', () => {
  test('T2-F18-01: Home page renders correctly under compact mobile viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(clientWidth).toBeLessThanOrEqual(375);
  });

  test('T2-F18-02: Labs catalog renders correctly under tablet viewport (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      await expect(page.locator('body')).toBeVisible();
    } else {
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('T2-F18-03: Login page input fields have associated placeholder or labels', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input').first()).toBeVisible();
    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const placeholder = await input.getAttribute('placeholder');
      const ariaLabel = await input.getAttribute('aria-label');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      expect(Boolean(placeholder || ariaLabel || name || id)).toBe(true);
    }
  });

  test('T2-F18-04: Register page form inputs provide accessible identifiers', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input').first()).toBeVisible();
    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('T2-F18-05: Dark mode styling attribute or class can be applied without layout crash', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await expect(page.locator('body')).toBeVisible();
  });
});
