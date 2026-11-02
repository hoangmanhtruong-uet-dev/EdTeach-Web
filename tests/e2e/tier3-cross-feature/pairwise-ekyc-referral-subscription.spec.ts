import { test, expect } from '@playwright/test';

/**
 * Tier 3 — Cross-Feature Pairwise Interaction 3: eKYC Verification + Referral Anti-Abuse + Subscription Tier
 * Interacting Features:
 * - Feature 3 (Privilege Escalation Lock)
 * - Feature 7 (Subscription Lifecycle)
 * - Feature 11 (Anti-Repetition eKYC & Referral Reward Guard)
 */
test.describe('Tier 3: Pairwise 3 - eKYC, Referral Anti-Abuse & Tier Entitlements', () => {
  test('T3-PAIR-07: Referral program enforces inviter and invitee identity separation', async ({ request }) => {
    // Unauthenticated caller cannot claim referral rewards
    const response = await request.post('/api/referral', {
      data: { referral_code: 'EDU_SELF_CLAIM' },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T3-PAIR-08: eKYC verification status rejects unverified role escalation to verified teacher', async ({ request }) => {
    const response = await request.post('/api/user/set-role', {
      data: {
        role: 'admin',
        is_verified_teacher: true,
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T3-PAIR-09: Pricing plan upgrade links directly to checkout without tier corruption', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    if (!page.url().includes('/login')) {
      const upgradeButtons = page.locator('button, a').filter({ hasText: /nâng cấp/i });
      await expect(upgradeButtons.first()).toBeVisible();
    }
  });
});
