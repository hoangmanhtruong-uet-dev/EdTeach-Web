import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const FRONTEND_DIR = path.resolve("frontend");

// ============================================================================
// SUITE 1: PR 4.1 — PhET CC BY-NC 4.0 Open Access & AI Value-Add Monetization
// ============================================================================
test("1.1 PhET 54 Simulations: Catalog size and 100% open access verification", async () => {
  const labsTs = fs.readFileSync(path.join(FRONTEND_DIR, "src/data/labs.ts"), "utf-8");
  const labsLib = fs.readFileSync(path.join(FRONTEND_DIR, "src/lib/labs.ts"), "utf-8");

  // Verify PhET CC BY-NC 4.0 Attribution object exists
  assert.match(labsTs, /export const PHET_CC_ATTRIBUTION/);
  assert.match(labsTs, /CC BY-NC 4\.0/);
  assert.match(labsTs, /phet\.colorado\.edu/);

  // Verify isLabFreeTrial returns true for all
  assert.match(labsTs, /export function isLabFreeTrial\(_slug: string\): boolean\s*\{\s*return true;\s*\}/);
  assert.match(labsTs, /export function isOpenAccessLab\(_slug: string\): boolean\s*\{\s*return true;\s*\}/);

  // Verify lib/labs.ts re-exports and helpers
  assert.match(labsLib, /export function isOpenAccessSimulation\(_slug: string\): boolean\s*\{\s*return true;\s*\}/);
  assert.match(labsLib, /export function getSimulationAttribution/);

  // Verify 54 labs are in LABS
  const matchSlug = labsTs.match(/slug:\s*"[^"]+"/g);
  assert.ok(matchSlug && matchSlug.length === 54, `Expected 54 labs, found ${matchSlug?.length}`);
});

test("1.2 Labs Catalog: No paywall locks on 3D canvas and open access indicators", async () => {
  const catalog = fs.readFileSync(path.join(FRONTEND_DIR, "src/app/labs/labs-catalog.tsx"), "utf-8");

  // Ensure card click blocker modal was removed
  assert.doesNotMatch(catalog, /setSelectedLockedLab/);
  assert.doesNotMatch(catalog, /isLocked/);
  assert.doesNotMatch(catalog, /grayscale-\[30%\]/);

  // Ensure open access badges are displayed
  assert.match(catalog, /100% Miễn Phí \(CC BY-NC 4\.0\)/);
  assert.match(catalog, /Mở tự do/);
});

test("1.3 Lab Viewer: Simulation canvas unblocked & WebGL memory leak disposal", async () => {
  const viewer = fs.readFileSync(path.join(FRONTEND_DIR, "src/components/labs/lab-viewer.tsx"), "utf-8");

  // Ensure 3D iframe is mounted directly without blocking paywall
  assert.match(viewer, /<iframe[\s\S]+?src=\{labFileUrl\(lab\.slug\)\}/);

  // Ensure WebGL cleanup on unmount (LAB-04)
  assert.match(viewer, /iframeRef\.current\.src\s*=\s*["']about:blank["']/);

  // Ensure PRO value-add tools are gated properly via LabFeatureUpgradeModal
  assert.match(viewer, /function LabFeatureUpgradeModal/);
  assert.match(viewer, /function LabAIAssistantDrawer/);
  assert.match(viewer, /function LabQuizGeneratorModal/);

  // Price alignment with plans.ts (149.000đ/tháng)
  assert.match(viewer, /PRO_MONTHLY\.price/);
});

test("1.4 Subscription Plans: 54 labs open access clearly documented", async () => {
  const plans = fs.readFileSync(path.join(FRONTEND_DIR, "src/lib/payment/plans.ts"), "utf-8");
  assert.match(plans, /54 bài mở miễn phí/);
  assert.doesNotMatch(plans, /Mở khóa toàn bộ 64\+ Phòng Thí Nghiệm/);
});

// ============================================================================
// SUITE 2: PR 4.2 — Marketing Alignment & Mock Data Removal
// ============================================================================
test("2.1 Truth in Advertising: Zero unbacked DeepSeek-R1 marketing claims", async () => {
  const filesToCheck = [
    "src/app/(dashboard)/pricing/page.tsx",
    "src/app/(dashboard)/settings/page.tsx",
    "src/lib/payment/plans.ts",
    "src/components/modals/upgrade-tier-modal.tsx",
    "src/app/page.tsx",
    "src/app/updates/page.tsx",
    "src/app/api/health/route.ts",
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(FRONTEND_DIR, relPath);
    const content = fs.readFileSync(fullPath, "utf-8");

    // Must not contain DeepSeek claims (case insensitive in text, except backwards compat type in preferences)
    assert.doesNotMatch(
      content,
      /DeepSeek-R1|Ưu tiên DeepSeek|DeepSeek R1|DeepSeek V3/i,
      `File ${relPath} still contains obsolete DeepSeek marketing copy`
    );
  }

  // Verify aligned copy in pricing and plans
  const pricing = fs.readFileSync(path.join(FRONTEND_DIR, "src/app/(dashboard)/pricing/page.tsx"), "utf-8");
  assert.match(pricing, /Gemini 2\.0 Thinking & Deep Reasoning/);

  const plans = fs.readFileSync(path.join(FRONTEND_DIR, "src/lib/payment/plans.ts"), "utf-8");
  assert.match(plans, /Gemini 2\.0 Thinking & Deep Reasoning/);
});

test("2.2 Semester Discount Badges: Unified to 'Tiết kiệm đến 20%' / '-20%'", async () => {
  const pricing = fs.readFileSync(path.join(FRONTEND_DIR, "src/app/(dashboard)/pricing/page.tsx"), "utf-8");
  assert.match(pricing, /Tiết kiệm đến 20%/);
  assert.doesNotMatch(pricing, /Tiết kiệm 25%/);

  const wallet = fs.readFileSync(path.join(FRONTEND_DIR, "src/app/(dashboard)/wallet/page.tsx"), "utf-8");
  assert.match(wallet, /-20%/);
});

test("2.3 Marketplace: Pulse skeleton loader & authentic data display", async () => {
  const marketplacePage = fs.readFileSync(
    path.join(FRONTEND_DIR, "src/app/(dashboard)/marketplace/page.tsx"),
    "utf-8"
  );

  // Pulse skeleton instead of simple spinner
  assert.match(marketplacePage, /animate-pulse/);
  assert.doesNotMatch(marketplacePage, /Đang tải dữ liệu từ Chợ Đề Thi\.\.\./);

  // Author badge updated to "Tác giả PRO"
  assert.match(marketplacePage, /Tác giả PRO/);

  // Honest rating condition
  assert.match(marketplacePage, /item\.review_count && item\.review_count > 0 && item\.rating > 0/);
  assert.match(marketplacePage, /Chưa có đánh giá/);
});

test("2.4 Marketplace Store: Sample items have zeroed mock ratings and downloads", async () => {
  const store = fs.readFileSync(path.join(FRONTEND_DIR, "src/lib/marketplace/marketplace-store.ts"), "utf-8");

  // Mock numbers 4.9, 5.0, 4.8 and download counts 148, 62, 95, 215 should not exist in sampleItems
  assert.doesNotMatch(store, /downloads_count:\s*(?:148|62|95|215)/);
  assert.doesNotMatch(store, /rating:\s*(?:4\.9|5\.0|4\.8|4\.7)/);
});

test("2.5 Whiteboard: Laser pointer tool integration with Excalidraw API", async () => {
  const editor = fs.readFileSync(path.join(FRONTEND_DIR, "src/components/whiteboard/whiteboard-editor.tsx"), "utf-8");

  assert.match(editor, /setActiveTool\?:/);
  assert.match(editor, /handleToggleLaser/);
  assert.match(editor, /onToggleLaser=\{handleToggleLaser\}/);
});

// ============================================================================
// SUITE 3: PR 4.3 — Accessibility, Overfetching & Font Self-Hosting
// ============================================================================
test("3.1 Student Radar Chart: Accessible HTML data table & reduced motion support", async () => {
  const chartPath = path.join(FRONTEND_DIR, "src/components/student/student-radar-chart.tsx");
  assert.ok(fs.existsSync(chartPath), "student-radar-chart.tsx must exist");

  const chart = fs.readFileSync(chartPath, "utf-8");

  // Permanent screen reader table for WCAG 2.1 AA
  assert.match(chart, /<div className="sr-only">/);
  assert.match(chart, /<caption[^>]*>Ma trận 4 cấp độ tư duy/);
  assert.match(chart, /<th scope="col">/);
  assert.match(chart, /<th scope="row">/);

  // Interactive table toggle
  assert.match(chart, /aria-expanded=\{activeView === "table"\}/);
  assert.match(chart, /aria-controls=\{tableId\}/);

  // Reduced motion media query & Tailwind class
  assert.match(chart, /prefers-reduced-motion/);
  assert.match(chart, /motion-reduce:transition-none motion-reduce:duration-0/);

  // Integrated into /student/progress
  const progressPage = fs.readFileSync(
    path.join(FRONTEND_DIR, "src/app/(student)/student/progress/page.tsx"),
    "utf-8"
  );
  assert.match(progressPage, /import StudentRadarChart from "@/);
  assert.match(progressPage, /<StudentRadarChart/);
});

test("3.2 Whiteboard Query Optimization: Eliminate massive elements & files overfetching", async () => {
  const api = fs.readFileSync(path.join(FRONTEND_DIR, "src/lib/api/whiteboard.ts"), "utf-8");

  // getUserWhiteboards selects only metadata
  assert.match(
    api,
    /\.select\("id, user_id, title, description, thumbnail_url, is_favorite, created_at, updated_at"\)/
  );

  // types/whiteboard.ts makes elements and app_state optional
  const types = fs.readFileSync(path.join(FRONTEND_DIR, "src/types/whiteboard.ts"), "utf-8");
  assert.match(types, /elements\?: Record<string, unknown>\[\];/);
  assert.match(types, /app_state\?: Record<string, unknown>;/);
  assert.match(types, /export type WhiteboardMetadata/);

  // Gallery page handles optional elements safely
  const gallery = fs.readFileSync(path.join(FRONTEND_DIR, "src/app/(dashboard)/whiteboard/page.tsx"), "utf-8");
  assert.match(gallery, /Array\.isArray\(b\.elements\)/);
});

test("3.3 Excalidraw Font Self-Hosting: Local fonts path and asset deployment", async () => {
  const canvas = fs.readFileSync(
    path.join(FRONTEND_DIR, "src/components/whiteboard/whiteboard-canvas.tsx"),
    "utf-8"
  );
  assert.match(canvas, /EXCALIDRAW_ASSET_PATH\s*=\s*["']\/["']/);

  const pkg = fs.readFileSync(path.join(FRONTEND_DIR, "package.json"), "utf-8");
  assert.match(pkg, /"copy-excalidraw-assets":/);
  assert.match(pkg, /"postinstall":\s*"npm run copy-excalidraw-assets"/);

  const fontsDir = path.join(FRONTEND_DIR, "public/fonts");
  assert.ok(fs.existsSync(fontsDir), "frontend/public/fonts must exist");

  const fontFiles = fs.readdirSync(fontsDir, { recursive: true });
  assert.ok(fontFiles.length >= 200, `Expected >= 200 font files, found ${fontFiles.length}`);
});
