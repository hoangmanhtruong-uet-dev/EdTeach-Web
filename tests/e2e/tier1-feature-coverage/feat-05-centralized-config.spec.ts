import { test, expect } from '@playwright/test';
import { TEST_CONSTANTS } from '../fixtures/test-constants';

/**
 * Tier 1 — Feature 5: Centralized Config & Canonical Domain (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 5), RC-12, SET-07, AFF-03
 * Opaque-box contract: Centralized configuration and canonical origin consistency.
 */
test.describe('Tier 1: Feature 5 - Centralized Config & Canonical Domain', () => {
  test('T1-F05-01: Health check endpoint confirms healthy operational status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('healthy');
  });

  test('T1-F05-02: Home landing page renders with valid branding title', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/EduTest|EdTeach/i);
  });

  test('T1-F05-03: Labs page displays canonical CC BY-NC 4.0 license attribution or validates auth gate', async ({ page }) => {
    await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('next=%2Flabs');
    } else {
      const content = await page.content();
      expect(content).toContain('CC BY-NC 4.0');
      expect(content).toContain('Tongjiang Lab');
    }
  });

  test('T1-F05-04: Referral endpoint provides 2,000 reward credits specification', async ({ request }) => {
    const response = await request.get('/api/referral');
    expect([401, 200]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.reward_per_referral).toBe(TEST_CONSTANTS.REFERRAL_BONUS_CREDITS);
    }
  });

  test('T1-F05-05: Standard API routes return application/json content type', async ({ request }) => {
    const response = await request.get('/api/health');
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });
});
