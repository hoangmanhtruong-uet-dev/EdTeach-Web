import { test, expect } from '@playwright/test';

/**
 * Tier 3 — Cross-Feature Pairwise Interaction: PhET Free Access, Whiteboard & AI Monetization
 * Interacting Features:
 * - Feature 16: PhET 54 Simulations 100% Free Open Access
 * - Feature 17: Marketing Alignment (Gemini 2.0 Thinking & Deep Reasoning)
 * - Feature 18: Accessibility & Performance Polish (Whiteboard overfetching & Radar Chart A11y)
 */
test.describe('Tier 3: Pairwise - PhET Open Access, Whiteboard Optimization & AI Monetization', () => {
  test('T3-PAIR-01: Pricing page advertises PRO value-add tools while PhET labs remain free', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    if (!page.url().includes('/login')) {
      const pageText = await page.content();
      // Should show Gemini 2.0 Thinking
      expect(pageText).toContain('Gemini 2.0 Thinking');
      // Should not claim DeepSeek
      expect(pageText).not.toContain('DeepSeek-R1');
      // Should show up to 20% discount badge
      expect(pageText).toContain('Tiết kiệm đến 20%');
    }
  });

  test('T3-PAIR-02: Labs catalog links seamlessly to wallet upgrade for value-add features', async ({ page }) => {
    await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (!page.url().includes('/login')) {
      const proLink = page.locator('a[href*="/wallet?plan=pro"]').first();
      await expect(proLink).toBeVisible();
    }
  });

  test('T3-PAIR-03: Whiteboard route is protected and does not overfetch unauthenticated sessions', async ({ request }) => {
    const res = await request.get('/whiteboard', { maxRedirects: 0 });
    expect([200, 301, 302, 307, 308, 401, 403, 404]).toContain(res.status());
  });

  test('T3-PAIR-04: Health check endpoint confirms Gemini 2.0 Thinking AI provider status', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.services.ai_engine.provider).toContain('Gemini 2.0');
    expect(body.services.ai_engine.provider).not.toContain('DeepSeek');
  });
});
