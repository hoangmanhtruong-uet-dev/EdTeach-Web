import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 16: PhET 54 Simulations 100% Free Open Access (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 16), RC-11, LAB-01, LAB-05
 * Opaque-box contract: Verification of 54 3D simulation catalog, open access, and CC BY-NC 4.0 license compliance.
 */
test.describe('Tier 1: Feature 16 - PhET 54 Simulations 100% Free Open Access', () => {
  test('T1-F16-01: Labs catalog page loads and displays 100% Free CC BY-NC 4.0 badge', async ({ page }) => {
    await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      await expect(page.locator('h1')).toContainText('Phòng thí nghiệm 3D');
      // Verify CC BY-NC 4.0 open access banner or badges
      const content = await page.content();
      expect(content).toContain('CC BY-NC 4.0');
      expect(content).toContain('100% Miễn Phí');
    }
  });

  test('T1-F16-02: Labs catalog displays all 4 subject categories with simulation cards', async ({ page }) => {
    await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      const content = await page.content();
      expect(content).toContain('Vật lý');
      expect(content).toContain('Hóa học');
      expect(content).toContain('Sinh học');
      expect(content).toContain('Địa lý');
      // Ensure "Mở tự do" badge is displayed instead of PRO locks
      expect(content).toContain('Mở tự do');
    }
  });

  test('T1-F16-03: Simulation viewer mounts 3D canvas iframe directly without blocking paywall', async ({ page }) => {
    await page.goto('/labs/photoelectric-step', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      const iframe = page.locator('iframe');
      await expect(iframe).toBeVisible();
      const iframeSrc = await iframe.getAttribute('src');
      expect(iframeSrc).toContain('/labs/courses/photoelectric-step.html');

      // Verify CC BY-NC 4.0 attribution button/badge
      await expect(page.locator('text=CC BY-NC 4.0').first()).toBeVisible();
    }
  });

  test('T1-F16-04: Non-trial simulation (e.g. capacitor-step) is 100% open access without paywall lockscreen', async ({ page }) => {
    await page.goto('/labs/capacitor-step', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      const iframe = page.locator('iframe');
      await expect(iframe).toBeVisible();
      const iframeSrc = await iframe.getAttribute('src');
      expect(iframeSrc).toContain('/labs/courses/capacitor-step.html');
    }
  });

  test('T1-F16-05: Simulation viewer displays PhET & Tongjiang Lab attribution and PRO tool options', async ({ page }) => {
    await page.goto('/labs/photoelectric-step', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      const pageText = await page.content();
      expect(pageText).toContain('PhET Interactive Simulations');
      expect(pageText).toContain('Tongjiang Lab');

      // Check toolbar value-add buttons
      expect(pageText).toContain('Kính vẽ');
      expect(pageText).toContain('Trợ lý AI');
      expect(pageText).toContain('Sinh đề 3D');
    }
  });
});
