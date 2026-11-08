import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3001';
const OUTPUT_DIR = path.resolve('promo_assets');
const CHROME_PATH = path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe');

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching browser with real Chrome...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // 2x crisp Retina display
  });

  const page = await context.newPage();

  // 1. Screenshot Landing Page (Trang Chủ)
  console.log('1. Capturing Landing Page...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '01_real_landing_page.png'),
    fullPage: false,
  });
  console.log('Saved: 01_real_landing_page.png');

  // 2. Screenshot Pricing Page (Bảng Giá Dịch Vụ)
  console.log('2. Capturing Pricing Page...');
  await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '02_real_pricing_tiers.png'),
    fullPage: false,
  });
  console.log('Saved: 02_real_pricing_tiers.png');

  // 3. Log in to access Dashboard & Protected Studio
  console.log('3. Logging in as test teacher...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Fill login
  await page.fill('input[type="email"]', 'test_teacher_e2e@edteach.vn');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
    console.log('Current URL after login attempt:', page.url());
  });
  await page.waitForTimeout(2500);

  // Capture Dashboard
  console.log('4. Capturing Teacher Dashboard...');
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '03_real_teacher_dashboard.png'),
    fullPage: false,
  });
  console.log('Saved: 03_real_teacher_dashboard.png');

  // 4. Capture Exam Studio (Soạn Thảo Đề Thi AI)
  console.log('5. Capturing Exam Studio...');
  await page.goto(`${BASE_URL}/exams/create`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '04_real_exam_studio.png'),
    fullPage: false,
  });
  console.log('Saved: 04_real_exam_studio.png');

  // 5. Capture Continuous Grading (Phòng Chấm Thi Trắc Nghiệm OMR)
  console.log('6. Capturing Continuous Grading...');
  await page.goto(`${BASE_URL}/grading`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '05_real_grading_room.png'),
    fullPage: false,
  });
  console.log('Saved: 05_real_grading_room.png');

  // 6. Capture Mobile OMR Viewfinder in phone viewport
  console.log('7. Capturing Mobile OMR Viewfinder...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 / modern smartphone
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  
  // Create a continuous session first to have a valid scanner token
  try {
    const res = await page.request.post(`${BASE_URL}/api/grading/continuous-session`, {
      data: {
        name: 'Kiểm tra 15 phút Toán 12',
        questionCount: 20,
        answerKey: { 1: 'A', 2: 'B', 3: 'C', 4: 'D' },
      },
    });
    const sessionData = await res.json();
    if (sessionData && sessionData.token) {
      await mobilePage.goto(`${BASE_URL}/scan/${sessionData.token}`, { waitUntil: 'domcontentloaded' });
      await mobilePage.waitForTimeout(2000);
      await mobilePage.screenshot({
        path: path.join(OUTPUT_DIR, '06_real_mobile_omr_scanner.png'),
        fullPage: false,
      });
      console.log('Saved: 06_real_mobile_omr_scanner.png');
    }
  } catch (err) {
    console.warn('Mobile scan capture note:', err.message);
  }

  // 7. Capture Plan / Subscription Tab
  console.log('8. Capturing Subscription Plans Tab...');
  await page.goto(`${BASE_URL}/settings?tab=plan`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '07_real_subscription_tab.png'),
    fullPage: false,
  });
  console.log('Saved: 07_real_subscription_tab.png');

  await browser.close();
  console.log('All real web screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error taking screenshots:', err);
  process.exit(1);
});
