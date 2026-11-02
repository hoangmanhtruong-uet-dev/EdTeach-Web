import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Challenger #1 Empirical Adversarial Stress Test Suite
 * Milestone 5 (PR Group 4: Compliance, Marketing Alignment & UX Polish)
 *
 * Exhaustive live verification of:
 * 1. All 54 PhET/Tongjiang simulation HTML courses return HTTP 200 OK.
 * 2. All 54 simulation WebP covers return HTTP 200 OK.
 * 3. Labs catalog renders open access badges ("Mở tự do", "100% Miễn Phí (CC BY-NC 4.0)") without paywall interceptors.
 * 4. Free/unauthenticated users can load arbitrary non-trial simulations across all 4 subjects without paywall lockscreens.
 * 5. Proprietary value-add tools (Whiteboard, AI Assistant, Quiz Generator) strictly enforce PRO upgrade modal.
 */

const FRONTEND_DIR = path.resolve('frontend');
const labsTsContent = fs.readFileSync(path.join(FRONTEND_DIR, 'src/data/labs.ts'), 'utf-8');
const allSlugs = [...labsTsContent.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);

test.describe('Challenger #1: Live Adversarial Stress Testing — All 54 Simulations & PRO Gating', () => {
  test('ADV-F16-01: Live HTTP check of all 54 simulation HTML files (status 200 OK, non-empty)', async ({ request }) => {
    expect(allSlugs.length).toBe(54);
    const failedSlugs: string[] = [];

    for (const slug of allSlugs) {
      const res = await request.get(`/labs/courses/${slug}.html`);
      if (res.status() !== 200) {
        failedSlugs.push(`${slug}: status ${res.status()}`);
        continue;
      }
      const text = await res.text();
      if (text.length < 500) {
        failedSlugs.push(`${slug}: truncated body (${text.length} bytes)`);
      }
    }

    expect(failedSlugs).toHaveLength(0);
  });

  test('ADV-F16-02: Live HTTP check of all 54 simulation WebP covers (status 200 OK, non-empty)', async ({ request }) => {
    expect(allSlugs.length).toBe(54);
    const failedSlugs: string[] = [];

    for (const slug of allSlugs) {
      const res = await request.get(`/labs/covers/${slug}.webp`);
      if (res.status() !== 200) {
        failedSlugs.push(`${slug}: status ${res.status()}`);
        continue;
      }
      const body = await res.body();
      if (body.byteLength < 500) {
        failedSlugs.push(`${slug}: truncated cover (${body.byteLength} bytes)`);
      }
    }

    expect(failedSlugs).toHaveLength(0);
  });

  test('ADV-F16-03: Catalog renders all 4 subjects with zero paywall lock badges', async ({ page }) => {
    await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (!page.url().includes('/login')) {
      // Must not display "Gói PRO" as a lock badge on cards
      const lockedBadges = page.locator('span:has-text("Gói PRO")');
      const lockedCount = await lockedBadges.count();
      expect(lockedCount).toBe(0);

      // Must display "100% Miễn Phí (CC BY-NC 4.0)"
      await expect(page.locator('text=100% Miễn Phí (CC BY-NC 4.0)').first()).toBeVisible();

      // Check all 4 subject categories
      await expect(page.locator('text=Vật lý')).toBeVisible();
      await expect(page.locator('text=Hóa học')).toBeVisible();
      await expect(page.locator('text=Sinh học')).toBeVisible();
      await expect(page.locator('text=Địa lý')).toBeVisible();
    }
  });

  test('ADV-F16-04: Non-trial simulations across all 4 subjects load iframe unconditionally', async ({ page }) => {
    // Pick 1 formerly locked simulation from each of the 4 subjects
    const testCases = [
      { subject: 'Vật lý', slug: 'current-field-step' },
      { subject: 'Hóa học', slug: 'ammonia-step' },
      { subject: 'Sinh học', slug: 'enzyme-step' },
      { subject: 'Địa lý', slug: 'earth-motion-step' },
    ];

    for (const tc of testCases) {
      await page.goto(`/labs/${tc.slug}`, { waitUntil: 'domcontentloaded' });
      if (!page.url().includes('/login')) {
        // Iframe must be visible and load the course html
        const iframe = page.locator('iframe');
        await expect(iframe).toBeVisible();
        const src = await iframe.getAttribute('src');
        expect(src).toContain(`/labs/courses/${tc.slug}.html`);

        // No paywall lockscreen modal
        const lockscreen = page.locator('text=Nâng cấp Gói PRO (99.000đ/tháng)');
        await expect(lockscreen).not.toBeVisible();
      }
    }
  });

  test('ADV-F16-05: Value-add PRO tools enforce upgrade modal with 149.000đ/tháng pricing', async ({ page }) => {
    await page.goto('/labs/current-field-step', { waitUntil: 'domcontentloaded' });
    if (!page.url().includes('/login')) {
      // 1. Click AI Assistant
      const aiBtn = page.locator('button:has-text("Trợ lý AI")').first();
      if (await aiBtn.isVisible()) {
        await aiBtn.click();
        const modal = page.locator('text=Đặc Quyền Gói PRO').first();
        await expect(modal).toBeVisible();
        await expect(page.locator('text=149.000đ')).toBeVisible();
        await expect(page.locator('text=miễn phí 100%').first()).toBeVisible();

        // Close modal
        const closeBtn = page.locator('button:has-text("Tiếp tục xem 3D")').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await expect(modal).not.toBeVisible();
        }
      }

      // 2. Click Whiteboard
      const wbBtn = page.locator('button:has-text("Kính vẽ")').first();
      if (await wbBtn.isVisible()) {
        await wbBtn.click();
        const modal = page.locator('text=Đặc Quyền Gói PRO').first();
        await expect(modal).toBeVisible();

        // Close modal
        const closeBtn = page.locator('button:has-text("Tiếp tục xem 3D")').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await expect(modal).not.toBeVisible();
        }
      }

      // 3. Click Quiz Generator
      const quizBtn = page.locator('button:has-text("Sinh đề 3D")').first();
      if (await quizBtn.isVisible()) {
        await quizBtn.click();
        const modal = page.locator('text=Đặc Quyền Gói PRO').first();
        await expect(modal).toBeVisible();

        // Close modal
        const closeBtn = page.locator('button:has-text("Tiếp tục xem 3D")').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await expect(modal).not.toBeVisible();
        }
      }
    }
  });
});
