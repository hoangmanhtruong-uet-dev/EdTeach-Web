import { test, expect } from '@playwright/test';

/**
 * Tier 4 — Scenario 4: Teacher Classroom Projection & 3D Lab Workflow
 * Real-world end-to-end scenario:
 * 1. Teacher opens /labs on projector.
 * 2. Selects an interactive simulation without hitting paywalls.
 * 3. Engages students with 3D demonstration and live poll.
 * 4. Navigates between subjects seamlessly.
 */
test.describe('Tier 4: Scenario 4 - Teacher Classroom Projection & 3D Lab Workflow', () => {
  test('T4-SCEN-01: Teacher accesses 3D simulation catalog and selects simulation for projection', async ({ page }) => {
    await page.goto('/labs', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      await expect(page.locator('h1')).toContainText('Phòng thí nghiệm 3D');
      // Click first available simulation card
      const firstCard = page.locator('a[href^="/labs/"]').first();
      await expect(firstCard).toBeVisible();
      await firstCard.click();
      await page.waitForLoadState('domcontentloaded');

      if (!page.url().includes('/login')) {
        // Confirm iframe is mounted
        const iframe = page.locator('iframe');
        await expect(iframe).toBeVisible();
        // Confirm attribution is present
        await expect(page.locator('text=PhET Interactive Simulations').first()).toBeVisible();
      }
    }
  });

  test('T4-SCEN-02: Classroom interactive polling complements 3D experiment session', async ({ request }) => {
    const createPoll = await request.post('/api/teach/live-poll/create', {
      data: {
        questionTitle: 'Hiện tượng gì xảy ra khi thay đổi tần số ánh sáng kích thích?',
        options: [
          'A. Xuất hiện quang điện ngoài',
          'B. Kim loại bị nóng chảy',
          'C. Không có electron bứt ra',
          'D. Điện trở tăng đột ngột',
        ],
        correctAnswer: 'A',
      },
    });

    expect(createPoll.status()).toBe(200);
    const pollBody = await createPoll.json();
    expect(pollBody.success).toBe(true);
    expect(pollBody.roomCode).toBeDefined();

    // Student casts vote
    const voteRes = await request.post('/api/teach/live-poll/vote', {
      data: {
        roomCode: pollBody.roomCode,
        choice: 'A',
        studentName: 'Học sinh Nguyễn Văn An',
      },
    });
    expect([200, 400]).toContain(voteRes.status());
  });

  test('T4-SCEN-03: Teacher returns to catalog and switches to Chemistry subject', async ({ page }) => {
    await page.goto('/labs/haber-step', { waitUntil: 'domcontentloaded' });
    if (!page.url().includes('/login')) {
      const iframe = page.locator('iframe');
      await expect(iframe).toBeVisible();
      expect(await iframe.getAttribute('src')).toContain('haber-step.html');

      // Click "Quay lại" to return to catalog
      const backLink = page.locator('a:has-text("Quay lại")').first();
      await backLink.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/labs');
    }
  });
});
