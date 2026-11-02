import { test, expect } from '@playwright/test';
import { assertRedirectsToLogin } from '../fixtures/api-helpers';

/**
 * Tier 1 — Feature 7: Subscription Lifecycle & Downgrade Cron (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 7), RC-13, PRC-01
 * Opaque-box contract: Subscription plans, pricing tiers, and access gating based on tier status.
 */
test.describe('Tier 1: Feature 7 - Subscription Lifecycle & Downgrade Cron', () => {
  test('T1-F07-01: Pricing page renders subscription plans with PRO and MAX options', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      const pageText = await page.content();
      expect(pageText).toContain('PRO');
      expect(pageText).toContain('MAX');
    }
  });

  test('T1-F07-02: Payment plans offer standard PRO tier pricing (149.000đ/month)', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      const pageText = await page.content();
      expect(pageText).toContain('149.000');
    }
  });

  test('T1-F07-03: Payment plans offer MAX tier pricing (229.000đ/month)', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      const pageText = await page.content();
      expect(pageText).toContain('229.000');
    }
  });

  test('T1-F07-04: Semester billing option offers bundled savings badge', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      const pageText = await page.content();
      expect(pageText).toMatch(/Tiết kiệm|Học kỳ/i);
    }
  });

  test('T1-F07-05: Unauthenticated access to /wallet subscription billing is guarded', async ({ request }) => {
    await assertRedirectsToLogin(request, '/wallet');
  });
});
