import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Playwright E2E Test: Teach Route /teach/[examId] Layout Stability & Responsiveness
 * Matrix Coverage:
 * 1. Viewports: 1366x768 & 1920x1080
 * 2. Left column widths: 340px, 400px, 520px, 640px, 800px, 1000px
 * 3. Font scaling: A- (0.9), A (1.0), A+ (1.2), A++ (1.4)
 * 4. Sample questions: Q1 (Short), Q3 (Fraction & Long text), Q4 (Geometry Oxyz + Punctuation)
 * 5. Visual screenshots and layout stability assertions (no horizontal overflow, no overlap, single-line header, no jumping)
 */

const SCREENSHOTS_DIR = path.join(process.cwd(), 'test-results', 'screenshots', 'teach-responsiveness');

let authCookieValue: string = '';

test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // Generate valid Supabase authenticated session token for teacher
  const supabaseModulePath = path.resolve(process.cwd(), 'frontend', 'node_modules', '@supabase', 'supabase-js');
  const { createClient } = require(supabaseModulePath);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://syzseivtldfkfkircirh.supabase.co';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enNlaXZ0bGRma2ZraXJjaXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MTA2MTMsImV4cCI6MjEwNzQ4NjYxM30.HaH-f3ipOMyFG9idHUnSQ_CsiJhCZzJ_JTJ-ucfwYr4';

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test_teacher_e2e@edteach.vn',
    password: 'Password123!@#',
  });

  if (error || !data?.session) {
    console.warn('[beforeAll] Supabase auth note:', error?.message);
  } else {
    authCookieValue = 'base64-' + Buffer.from(JSON.stringify(data.session)).toString('base64');
  }
});

test.beforeEach(async ({ context }) => {
  if (authCookieValue) {
    await context.addCookies([
      {
        name: 'sb-syzseivtldfkfkircirh-auth-token',
        value: authCookieValue,
        domain: 'localhost',
        path: '/',
      },
    ]);
  }
});

test.describe('Teach Studio - Question Pane Stability & Container Queries', () => {
  // --------------------------------------------------------------------------
  // TEST 1: Matrix across 1366x768 with widths and font scales
  // --------------------------------------------------------------------------
  test('T-RESP-01: Multi-width and font-scale matrix on 1366x768 viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/teach/seed-toan-12', { waitUntil: 'domcontentloaded' });

    // Ensure question pane is visible
    const questionPane = page.locator('.question-pane');
    await expect(questionPane).toBeVisible({ timeout: 15000 });

    const widths = [340, 400, 520, 640, 800];
    const scales = [
      { label: 'A-', selector: 'button[aria-label="Cỡ chữ nhỏ 0.9x"]' },
      { label: 'A', selector: 'button[aria-label="Cỡ chữ chuẩn 1.0x"]' },
      { label: 'A+', selector: 'button[aria-label="Cỡ chữ to 1.2x"]' },
      { label: 'A++', selector: 'button[aria-label="Cỡ chữ cực đại 1.4x"]' },
    ];

    // Test on Question 1 (Short)
    for (const width of widths) {
      await page.evaluate((w) => {
        const leftCol = document.querySelector('.question-pane')?.parentElement as HTMLElement;
        if (leftCol) {
          leftCol.style.width = `${w}px`;
          leftCol.style.minWidth = `${w}px`;
          leftCol.style.maxWidth = `${w}px`;
        }
      }, width);

      // Allow container query and DOM recalculation
      await page.waitForTimeout(60);

      for (const scale of scales) {
        await page.click(scale.selector);
        await page.waitForTimeout(40);

        // Verification 1: No horizontal overflow
        const overflowCheck = await page.evaluate(() => {
          const pane = document.querySelector('.question-pane') as HTMLElement;
          if (!pane) return { hasOverflow: false, scrollWidth: 0, clientWidth: 0 };
          return {
            hasOverflow: pane.scrollWidth > pane.clientWidth + 2,
            scrollWidth: pane.scrollWidth,
            clientWidth: pane.clientWidth,
          };
        });
        expect(overflowCheck.hasOverflow).toBe(false);

        // Verification 2: Options do not overlap
        const overlapCheck = await page.evaluate(() => {
          const options = Array.from(document.querySelectorAll('.answers-grid button'));
          if (options.length < 2) return false;
          for (let i = 0; i < options.length; i++) {
            const r1 = options[i].getBoundingClientRect();
            for (let j = i + 1; j < options.length; j++) {
              const r2 = options[j].getBoundingClientRect();
              const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
              const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
              if (xOverlap > 2 && yOverlap > 2) return true;
            }
          }
          return false;
        });
        expect(overlapCheck).toBe(false);

        // Verification 3: 1-column vs 2-column layout threshold (520px)
        const gridColumns = await page.evaluate(() => {
          const grid = document.querySelector('.answers-grid') as HTMLElement;
          if (!grid) return 0;
          const style = window.getComputedStyle(grid);
          return style.gridTemplateColumns.split(' ').length;
        });

        if (width < 520) {
          expect(gridColumns).toBe(1);
        } else {
          expect(gridColumns).toBe(2);
        }

        // Verification 4: Header does not break into multiple rows
        const headerHeight = await page.evaluate(() => {
          const header = document.querySelector('.question-pane header, .question-pane > div:first-child') as HTMLElement;
          return header ? header.offsetHeight : 0;
        });
        expect(headerHeight).toBeLessThanOrEqual(60);

        // Verification 5: Under 420px, secondary text labels in header/chips are hidden
        if (width < 420) {
          const chipLabelsVisible = await page.evaluate(() => {
            const labels = Array.from(document.querySelectorAll('.qpane-chip-label'));
            return labels.some((el) => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none';
            });
          });
          expect(chipLabelsVisible).toBe(false);
        }
      }

      // Save screenshot for each width at scale 1.0
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `1366x768_w${width}_scale1.0_q1.png`),
        fullPage: false,
      });
    }
  });

  // --------------------------------------------------------------------------
  // TEST 2: High Resolution 1920x1080 with Question 3 (Long + Fractions) & Q4
  // --------------------------------------------------------------------------
  test('T-RESP-02: Complex questions (fractions, formulas, 60-char options) on 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/teach/seed-toan-12', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.question-pane')).toBeVisible({ timeout: 15000 });

    // Navigate to Question 3 using stepper aria-label
    await page.click('button[aria-label="Chuyển tới Câu 3"]');
    await page.waitForTimeout(200);

    const widths = [340, 520, 800, 1000];

    for (const width of widths) {
      await page.evaluate((w) => {
        const leftCol = document.querySelector('.question-pane')?.parentElement as HTMLElement;
        if (leftCol) {
          leftCol.style.width = `${w}px`;
          leftCol.style.minWidth = `${w}px`;
          leftCol.style.maxWidth = `${w}px`;
        }
      }, width);
      await page.waitForTimeout(60);

      // Verify Question 3 options and fraction rendering do not clip
      const q3Check = await page.evaluate(() => {
        const pane = document.querySelector('.question-pane') as HTMLElement;
        const options = Array.from(document.querySelectorAll('.answers-grid button'));
        const optionsOverflow = options.some((opt) => opt.scrollWidth > opt.clientWidth + 2);
        return {
          paneOverflow: pane ? pane.scrollWidth > pane.clientWidth + 2 : false,
          optionsOverflow,
        };
      });
      expect(q3Check.paneOverflow).toBe(false);
      expect(q3Check.optionsOverflow).toBe(false);

      // Screenshot Question 3
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `1920x1080_w${width}_scale1.0_q3_fraction.png`),
      });
    }

    // Navigate to Question 4 (Geometry Oxyz + Punctuation wrapping)
    await page.click('button[aria-label="Chuyển tới Câu 4"]');
    await page.waitForTimeout(200);

    // Verify inline-math-wrapper groups formula with trailing punctuation
    const punctuationCheck = await page.evaluate(() => {
      const wrappers = Array.from(document.querySelectorAll('.inline-math-wrapper'));
      return wrappers.length > 0;
    });
    expect(punctuationCheck).toBe(true);

    // Verify long text stays within bounds at min-width 340px
    await page.evaluate(() => {
      const leftCol = document.querySelector('.question-pane')?.parentElement as HTMLElement;
      if (leftCol) {
        leftCol.style.width = '340px';
        leftCol.style.minWidth = '340px';
        leftCol.style.maxWidth = '340px';
      }
    });
    await page.waitForTimeout(60);

    const isOptionWithinBounds = await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('.answers-grid button'));
      return options.every((opt) => opt.scrollWidth <= opt.clientWidth + 1);
    });
    expect(isOptionWithinBounds).toBe(true);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `1920x1080_w340_q4_punctuation_bounds.png`),
    });
  });

  // --------------------------------------------------------------------------
  // TEST 3: Splitter Dragging Smoothness & Canvas Isolation
  // --------------------------------------------------------------------------
  test('T-RESP-03: Splitter dragging animation, canvas pointer isolation & zero vertical jumping', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/teach/seed-toan-12', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.question-pane')).toBeVisible({ timeout: 15000 });

    const splitter = page.locator('[role="separator"]');
    await expect(splitter).toBeVisible();

    // Measure initial top offset of question text
    const initialTextTop = await page.evaluate(() => {
      const qText = document.querySelector('.question-text') as HTMLElement;
      return qText ? qText.getBoundingClientRect().top : 0;
    });

    // Start dragging the splitter
    const box = await splitter.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();

      // Check that during drag, an overlay exists or pointer-events are disabled on canvas
      const isDragProtected = await page.evaluate(() => {
        const overlay = document.querySelector('.cursor-col-resize.fixed');
        return !!overlay;
      });
      expect(isDragProtected).toBe(true);

      // Move mouse dynamically back and forth across frames
      for (let offset = 20; offset <= 120; offset += 30) {
        await page.mouse.move(box.x + box.width / 2 + offset, box.y + box.height / 2);
        await page.waitForTimeout(20);
      }

      for (let offset = 120; offset >= -40; offset -= 30) {
        await page.mouse.move(box.x + box.width / 2 + offset, box.y + box.height / 2);
        await page.waitForTimeout(20);
      }

      await page.mouse.up();
      await page.waitForTimeout(100);

      // Verify that after drag ends, question text top offset has NOT drifted or jumped vertically
      const finalTextTop = await page.evaluate(() => {
        const qText = document.querySelector('.question-text') as HTMLElement;
        return qText ? qText.getBoundingClientRect().top : 0;
      });

      // The top offset of the question should remain aligned at the top (delta <= 2px)
      expect(Math.abs(finalTextTop - initialTextTop)).toBeLessThanOrEqual(2);
    }

    // Test double-click reset to 50:50
    await splitter.dblclick();
    await page.waitForTimeout(250);

    const splitStyle = await page.evaluate(() => {
      const separator = document.querySelector('[role="separator"]');
      const container = separator?.parentElement as HTMLElement;
      return container ? container.style.getPropertyValue('--split') : '';
    });
    expect(splitStyle).toBe('50%');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `1366x768_drag_end_reset5050.png`),
    });
  });

  // --------------------------------------------------------------------------
  // TEST 4: Reveal Answer & Confetti Interaction without Layout Disruption
  // --------------------------------------------------------------------------
  test('T-RESP-04: Reveal correct answer triggers visual pulse and dim without layout shift', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/teach/seed-toan-12', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.question-pane')).toBeVisible({ timeout: 15000 });

    // Press 'Enter' to reveal correct answer
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);

    // Verify correct option is highlighted with green border / pulse
    const correctOpt = page.locator('button[data-correct="true"]');
    await expect(correctOpt).toBeVisible();

    // Verify incorrect options are dimmed
    const isDimmed = await page.evaluate(() => {
      const incorrectOpts = Array.from(document.querySelectorAll('button[data-correct="false"]'));
      return incorrectOpts.length > 0 && incorrectOpts.every((el) => el.classList.contains('opacity-35'));
    });
    expect(isDimmed).toBe(true);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `1366x768_reveal_correct_answer.png`),
    });
  });
});
