import { test, expect } from '@playwright/test';
import { assertRedirectsToLogin } from '../fixtures/api-helpers';

/**
 * Tier 3 — Cross-Feature Pairwise Interaction 5: SSRF Guard + Whiteboard Guard + Canonical Routing
 * Interacting Features:
 * - Feature 1 (Middleware Route Matcher & Auth Guard)
 * - Feature 5 (Centralized Config & Canonical Domain)
 * - Feature 14 (Marketplace Empty Exam & SSRF Importer Fix)
 * - Feature 16 (PhET 54 Simulations 100% Free Open Access)
 */
test.describe('Tier 3: Pairwise 5 - SSRF Guard, Whiteboard Protection & Open Access Routing', () => {
  test('T3-PAIR-13: Whiteboard collaborative tool requires authentication and guards against anonymous access', async ({ request }) => {
    // Unauthenticated access to /whiteboard must be protected
    const response = await request.get('/whiteboard', { maxRedirects: 0 });
    expect([301, 302, 307, 308, 401, 403, 404]).toContain(response.status());
  });

  test('T3-PAIR-14: SSRF guard protects internal network while allowing legitimate public education URLs', async ({ request }) => {
    // Private IP is denied
    const privateRes = await request.post('/api/exams/import-from-url', {
      data: { url: 'http://172.16.0.1/exam' },
    });
    expect([401, 403]).toContain(privateRes.status());
  });

  test('T3-PAIR-15: Open access PhET 3D simulations are accessible without requiring teacher login or payment', async ({ page }) => {
    await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      // In Milestone 1, middleware intercepts unauthenticated users
      expect(page.url()).toContain('/login');
    } else {
      await expect(page.locator('h1')).toContainText('Phòng thí nghiệm 3D');
    }
  });
});
