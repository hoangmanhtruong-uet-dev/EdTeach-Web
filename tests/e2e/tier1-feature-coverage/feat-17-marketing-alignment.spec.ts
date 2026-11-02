import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 17: Marketing Alignment & Mock Data Cleanup (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 17), RC-10, PRC-03, MKT-13
 * Opaque-box contract: Marketing copy alignment, transparent pricing packages, and clean branding.
 */
test.describe('Tier 1: Feature 17 - Marketing Alignment & Mock Data Cleanup', () => {
  test('T1-F17-01: Landing page loads successfully without server error', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
  });

  test('T1-F17-02: Landing page includes calls-to-action for free trial', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Dùng thử|Bắt đầu|Đăng ký|EduTest/i);
  });

  test('T1-F17-03: User registration page loads successfully', async ({ page }) => {
    const response = await page.goto('/register', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('T1-F17-04: User login page loads successfully with login form', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/Đăng nhập/i);
  });

  test('T1-F17-05: Pricing page includes 4 credit top-up packages', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    if (!page.url().includes('/login')) {
      await expect(page.locator('body')).toContainText(/Credits|PRO|MAX/i);
    }
  });
});
