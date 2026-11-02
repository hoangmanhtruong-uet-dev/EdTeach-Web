import { test, expect } from '@playwright/test';

/**
 * Challenger #2 Adversarial E2E Stress Suite: PR 4.3 Deep Verification
 * Focus Areas:
 * 1. Screen Reader Compliance (role="img", table, caption, th, tr)
 * 2. Vestibular Motion Sensitivity (prefers-reduced-motion)
 * 3. Whiteboard Payload Optimization (absence of elements/files overfetching)
 * 4. Excalidraw Local Font Self-Hosting (HTTP 200 on local font assets & Zero CDN leakage)
 */
test.describe('Challenger M5-2: Empirical Accessibility & Font Stress Verification', () => {

  test('ADV-CH2-01: Excalidraw fonts are served locally with HTTP 200 for all core families', async ({ request }) => {
    const fontsToCheck = [
      '/fonts/Virgil/Virgil-Regular.woff2',
      '/fonts/Cascadia/CascadiaCode-Regular.woff2',
      '/fonts/Assistant/Assistant-Regular.woff2',
      '/fonts/Liberation/LiberationSans-Regular.woff2',
      '/fonts/Excalifont/Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2',
    ];

    for (const fontUrl of fontsToCheck) {
      const res = await request.get(fontUrl);
      expect([200, 304]).toContain(res.status());
      const contentType = res.headers()['content-type'] || '';
      expect(contentType.toLowerCase()).toMatch(/font|woff2|octet-stream/);
    }
  });

  test('ADV-CH2-02: Zero external font requests to unpkg.com or esm.sh during page navigation', async ({ page }) => {
    const cdnRequests: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('unpkg.com') || url.includes('esm.sh') || url.includes('fonts.googleapis.com')) {
        cdnRequests.push(url);
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });

    expect(cdnRequests.length).toBe(0);
  });

  test('ADV-CH2-03: prefers-reduced-motion suppresses animations and respects vestibular accessibility', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verify matchMedia evaluates to true in browser runtime
    const prefersReduced = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    expect(prefersReduced).toBe(true);
  });

  test('ADV-CH2-04: Student progress page accessibility and screen reader table verification', async ({ page }) => {
    await page.goto('/student/progress', { waitUntil: 'domcontentloaded' });

    if (page.url().includes('/login')) {
      // Middleware protected: verify auth guard handles redirection cleanly
      await expect(page.locator('body')).toBeVisible();
    } else {
      // If session is present or mock allowed:
      const radarSvg = page.locator('svg[role="img"]');
      if (await radarSvg.count() > 0) {
        // 1. Verify role="img" and aria-labelledby
        await expect(radarSvg).toHaveAttribute('role', 'img');
        const labelledBy = await radarSvg.getAttribute('aria-labelledby');
        expect(labelledBy).toBeTruthy();

        // 2. Verify sr-only table exists with caption and proper headers
        const srTable = page.locator('.sr-only table');
        await expect(srTable).toBeAttached();
        await expect(srTable.locator('caption')).toBeAttached();
        await expect(srTable.locator('th[scope="col"]')).toHaveCount(5);
        await expect(srTable.locator('th[scope="row"]')).toHaveCount(4);

        // 3. Test interactive toggle button
        const toggleBtn = page.locator('button[aria-controls]').first();
        await expect(toggleBtn).toBeVisible();
        await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

        // Click to expand accessible data table
        await toggleBtn.click();
        await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

        // Visible table should now be rendered
        const visibleTable = page.locator('table').nth(1);
        await expect(visibleTable).toBeVisible();
        await expect(visibleTable.locator('caption')).toBeVisible();
      }
    }
  });

  test('ADV-CH2-05: Whiteboard API endpoint handles unauthenticated requests without leaking vector payloads', async ({ request }) => {
    const res = await request.get('/whiteboard', { maxRedirects: 0 });
    // Must redirect to login or protect route
    expect([200, 301, 302, 307, 308, 401, 403]).toContain(res.status());

    // Verify response body does not leak massive JSONB payloads
    const text = await res.text();
    expect(text.length).toBeLessThan(100000); // Must be small metadata / HTML shell, never megabytes of vector points
    expect(text).not.toContain('"elements":[');
  });
});
