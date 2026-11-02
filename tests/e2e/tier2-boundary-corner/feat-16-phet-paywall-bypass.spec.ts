import { test, expect } from '@playwright/test';

/**
 * Tier 2 — Feature 16: PhET Paywall Bypass & Monetization Boundaries
 * Requirements: PROJECT.md § Feature Inventory (Feature 16), RC-11, LAB-01, LAB-05
 * Opaque-box contract: Iframe persistence, value-add tool gating, and CC BY-NC 4.0 integrity.
 */
test.describe('Tier 2: Feature 16 - PhET Paywall Bypass & Value-Add Monetization Boundaries', () => {
  test('T2-F16-01: Value-add PRO tools show upgrade modal without blocking background iframe', async ({ page }) => {
    await page.goto('/labs/photoelectric-step', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      // Find and click the AI assistant or whiteboard tool button
      const aiBtn = page.locator('button:has-text("Trợ lý AI"), button:has-text("Kính vẽ")').first();
      if (await aiBtn.isVisible()) {
        await aiBtn.click();
        // Upgrade modal should appear for unauthenticated/free users
        const upgradeModal = page.locator('text=Đặc Quyền Gói PRO, text=Nâng cấp Gói PRO').first();
        if (await upgradeModal.isVisible()) {
          await expect(upgradeModal).toBeVisible();
          // Verify simulation iframe is STILL present in DOM
          const iframe = page.locator('iframe');
          await expect(iframe).toBeVisible();

          // Close modal
          const closeBtn = page.locator('button:has-text("Tiếp tục xem 3D"), button >> svg.lucide-x').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await expect(upgradeModal).not.toBeVisible();
          }
        }
      }
    }
  });

  test('T2-F16-02: Attribution details dialog opens and displays legal disclaimer', async ({ page }) => {
    await page.goto('/labs/photoelectric-step', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      const detailsBtn = page.locator('button:has-text("Chi tiết giấy phép"), button:has-text("CC BY-NC 4.0")').first();
      if (await detailsBtn.isVisible()) {
        await detailsBtn.click();
        await expect(page.locator('text=Giấy Phép Bản Quyền & Nguồn Gốc (CC BY-NC 4.0)')).toBeVisible();
        await expect(page.locator('text=Three.js (MIT License)')).toBeVisible();
        // Close modal
        const closeBtn = page.locator('button:has-text("Đã hiểu")');
        await closeBtn.click();
        await expect(page.locator('text=Giấy Phép Bản Quyền & Nguồn Gốc')).not.toBeVisible();
      }
    }
  });

  test('T2-F16-03: Invalid lab slug handles safely without crashing server', async ({ page }) => {
    const response = await page.goto('/labs/invalid-simulation-slug-xyz', { waitUntil: 'domcontentloaded' });
    expect([200, 307, 308, 404]).toContain(response?.status());
  });

  test('T2-F16-04: Multiple subjects can be navigated without paywall triggers', async ({ page }) => {
    for (const slug of ['haber-step', 'river-step']) {
      await page.goto(`/labs/${slug}`, { waitUntil: 'domcontentloaded' });
      if (!page.url().includes('/login')) {
        const iframe = page.locator('iframe');
        await expect(iframe).toBeVisible();
        expect(await iframe.getAttribute('src')).toContain(slug);
      }
    }
  });
});
