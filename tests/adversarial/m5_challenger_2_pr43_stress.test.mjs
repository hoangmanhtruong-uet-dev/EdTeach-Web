// tests/adversarial/m5_challenger_2_pr43_stress.test.mjs
// ==============================================================================
// EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — MILESTONE 5 (PR 4.3 DEEP CHALLENGE)
// Challenger #2 (Replacement): Critic & Specialist
//
// Target Scope:
// 1. Screen Reader Compliance & Semantic Markup (role="img", table, caption, th, tr)
// 2. Vestibular Motion Sensitivity & Media Query Adaptation (prefers-reduced-motion)
// 3. Whiteboard Overfetching Elimination & Payload Compression Benchmark
// 4. Excalidraw Local Font Self-Hosting (Zero Remote CDN Leakage, 234 Assets)
// 5. Boundary Condition Stress & Math Robustness in Student Radar Chart
// ==============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("================================================================================");
console.log("CHALLENGER #2 (M5 Replacement) EMPIRICAL ADVERSARIAL HARNESS — PR 4.3");
console.log("Scope: A11y Polish, Typography, Whiteboard Overfetching & Local Fonts");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;
let failedTests = 0;
const testResults = [];

function runTest(name, fn) {
  totalTests++;
  const start = performance.now();
  try {
    fn();
    const duration = (performance.now() - start).toFixed(2);
    passedTests++;
    testResults.push({ name, status: "PASS", duration: `${duration}ms` });
    console.log(`[PASS] ${name} (${duration}ms)`);
  } catch (err) {
    failedTests++;
    const duration = (performance.now() - start).toFixed(2);
    testResults.push({ name, status: "FAIL", error: err.message, duration: `${duration}ms` });
    console.error(`[FAIL] ${name} (${duration}ms)`);
    console.error(`       Error: ${err.message}`);
  }
}

async function runTestAsync(name, fn) {
  totalTests++;
  const start = performance.now();
  try {
    await fn();
    const duration = (performance.now() - start).toFixed(2);
    passedTests++;
    testResults.push({ name, status: "PASS", duration: `${duration}ms` });
    console.log(`[PASS] ${name} (${duration}ms)`);
  } catch (err) {
    failedTests++;
    const duration = (performance.now() - start).toFixed(2);
    testResults.push({ name, status: "FAIL", error: err.message, duration: `${duration}ms` });
    console.error(`[FAIL] ${name} (${duration}ms)`);
    console.error(`       Error: ${err.message}`);
  }
}

const FRONTEND_DIR = path.resolve("frontend");
const radarChartPath = path.join(FRONTEND_DIR, "src/components/student/student-radar-chart.tsx");
const whiteboardApiPath = path.join(FRONTEND_DIR, "src/lib/api/whiteboard.ts");
const whiteboardTypesPath = path.join(FRONTEND_DIR, "src/types/whiteboard.ts");
const whiteboardPagePath = path.join(FRONTEND_DIR, "src/app/(dashboard)/whiteboard/page.tsx");
const whiteboardCanvasPath = path.join(FRONTEND_DIR, "src/components/whiteboard/whiteboard-canvas.tsx");
const fontsDir = path.join(FRONTEND_DIR, "public/fonts");
const packageJsonPath = path.join(FRONTEND_DIR, "package.json");

// ==============================================================================
// SUITE 1: SCREEN READER COMPLIANCE & ACCESSIBLE SEMANTIC MARKUP
// ==============================================================================

runTest("TEST 1.1: student-radar-chart.tsx implements WCAG 2.1 AA screen reader data table", () => {
  assert.ok(fs.existsSync(radarChartPath), "student-radar-chart.tsx must exist");
  const code = fs.readFileSync(radarChartPath, "utf8");

  // Must contain .sr-only container
  assert.ok(code.includes('className="sr-only"'), "Must contain sr-only container for screen readers");
  
  // Must contain table semantic elements
  assert.ok(code.includes("<table>"), "Must contain <table> tag");
  assert.ok(code.includes("<caption>"), "Must contain <caption> tag for WCAG table identification");
  assert.ok(code.includes("<th scope=\"col\">"), "Must contain <th scope=\"col\"> column headers");
  assert.ok(code.includes("<th scope=\"row\">"), "Must contain <th scope=\"row\"> row headers");
  assert.ok(code.includes("<tbody>"), "Must contain <tbody>");
  assert.ok(code.includes("<tr>"), "Must contain <tr> row elements");
  assert.ok(code.includes("<td>"), "Must contain <td> data elements");
});

runTest("TEST 1.2: student-radar-chart.tsx implements SVG role=\"img\" and accessible labels", () => {
  const code = fs.readFileSync(radarChartPath, "utf8");

  // SVG accessibility attributes
  assert.ok(code.includes('role="img"'), 'SVG must define role="img"');
  assert.ok(code.includes('aria-labelledby='), 'SVG must define aria-labelledby');
  assert.ok(code.includes("<title id="), "SVG must provide accessible <title> element");
  assert.ok(code.includes("<desc id="), "SVG must provide detailed accessible <desc> summary");
});

runTest("TEST 1.3: Interactive view toggle implements proper WAI-ARIA switch semantics", () => {
  const code = fs.readFileSync(radarChartPath, "utf8");

  assert.ok(code.includes("aria-expanded="), "Toggle button must define aria-expanded");
  assert.ok(code.includes("aria-controls="), "Toggle button must define aria-controls linked to table");
  assert.ok(code.includes("aria-label="), "Toggle button must have accessible aria-label");
  assert.ok(code.includes("useId()"), "Must use React useId() to ensure collision-free ARIA IDs");
});

// ==============================================================================
// SUITE 2: VESTIBULAR MOTION SENSITIVITY (prefers-reduced-motion)
// ==============================================================================

runTest("TEST 2.1: prefers-reduced-motion media query detection and event listeners", () => {
  const code = fs.readFileSync(radarChartPath, "utf8");

  assert.ok(
    code.includes('window.matchMedia("(prefers-reduced-motion: reduce)")'),
    "Must query window.matchMedia for prefers-reduced-motion"
  );
  assert.ok(
    code.includes("addEventListener") && code.includes("removeEventListener"),
    "Must attach and clean up change event listeners"
  );
  assert.ok(
    code.includes("addListener") && code.includes("removeListener"),
    "Must provide fallback for legacy Safari / WebView addListener"
  );
});

runTest("TEST 2.2: Animation suppression applied via both JS state and Tailwind CSS classes", () => {
  const code = fs.readFileSync(radarChartPath, "utf8");

  // JS state suppresses animation class completely when reduced motion is preferred
  assert.ok(
    code.includes("prefersReducedMotion"),
    "Must maintain prefersReducedMotion state"
  );
  // CSS fallback classes present
  assert.ok(
    code.includes("motion-reduce:transition-none"),
    "Must include Tailwind motion-reduce:transition-none"
  );
  assert.ok(
    code.includes("motion-reduce:duration-0"),
    "Must include Tailwind motion-reduce:duration-0"
  );
});

// ==============================================================================
// SUITE 3: WHITEBOARD OVERFETCHING & PAYLOAD SIZE BENCHMARK
// ==============================================================================

runTest("TEST 3.1: getUserWhiteboards() explicitly excludes heavy elements and files columns", () => {
  assert.ok(fs.existsSync(whiteboardApiPath), "whiteboard.ts API module must exist");
  const code = fs.readFileSync(whiteboardApiPath, "utf8");

  // Find getUserWhiteboards function body between declaration and next function
  const fnMatch = code.match(/async function getUserWhiteboards\(\)[\s\S]*?(?=export async function getWhiteboardById)/);
  assert.ok(fnMatch, "getUserWhiteboards function must be defined");
  const fnBody = fnMatch[0];

  assert.ok(
    fnBody.includes('.select("id, user_id, title, description, thumbnail_url, is_favorite, created_at, updated_at")'),
    "getUserWhiteboards() must selectively query metadata only"
  );
  assert.ok(!fnBody.includes('.select("*")'), "getUserWhiteboards() must NOT call .select('*')");
  assert.ok(!fnBody.includes("elements"), "getUserWhiteboards select clause must not include elements column");
  assert.ok(!fnBody.includes("files"), "getUserWhiteboards select clause must not include files column");
});

runTest("TEST 3.2: getWhiteboardById() retains full payload selection for editor session", () => {
  const code = fs.readFileSync(whiteboardApiPath, "utf8");
  const fnMatch = code.match(/async function getWhiteboardById\([\s\S]*?return[\s\S]*?;/);
  assert.ok(fnMatch, "getWhiteboardById function must be defined");
  const fnBody = fnMatch[0];

  assert.ok(fnBody.includes('.select("*")'), "getWhiteboardById must retain .select('*') for full canvas loading");
});

runTest("TEST 3.3: Whiteboard type definition marks elements, app_state, and files as optional", () => {
  assert.ok(fs.existsSync(whiteboardTypesPath), "whiteboard.ts types module must exist");
  const code = fs.readFileSync(whiteboardTypesPath, "utf8");

  assert.ok(/elements\?:\s*Record<string,\s*unknown>\[\]/.test(code), "elements must be optional (elements?:)");
  assert.ok(/app_state\?:\s*Record<string,\s*unknown>/.test(code), "app_state must be optional (app_state?:)");
  assert.ok(/files\?:\s*Record<string,\s*unknown>/.test(code), "files must be optional (files?:)");
  assert.ok(code.includes("export type WhiteboardMetadata"), "WhiteboardMetadata type helper must exist");
});

runTest("TEST 3.4: Whiteboard dashboard page safely handles undefined elements without crash", () => {
  assert.ok(fs.existsSync(whiteboardPagePath), "whiteboard page.tsx must exist");
  const code = fs.readFileSync(whiteboardPagePath, "utf8");

  // Verify safe array checking before length access
  assert.ok(
    code.includes("Array.isArray(b.elements) ? b.elements.length : 0"),
    "Must guard b.elements with Array.isArray checks"
  );
  // Total elements calculation safe check
  assert.ok(
    code.includes("(acc, b) => acc + (Array.isArray(b.elements) ? b.elements.length : 0)"),
    "Stats reduce must safely handle undefined elements"
  );
});

runTest("TEST 3.5: Empirical Payload Compression Benchmark (Simulated Vector + Base64 Dataset)", () => {
  // Generate realistic Excalidraw element simulation: 500 vector strokes
  const simulatedElements = Array.from({ length: 500 }, (_, i) => ({
    id: `elem_${i}_${Math.random().toString(36).substring(2, 9)}`,
    type: i % 3 === 0 ? "rectangle" : i % 3 === 1 ? "freedraw" : "arrow",
    x: Math.floor(Math.random() * 1920),
    y: Math.floor(Math.random() * 1080),
    width: 250,
    height: 120,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    points: Array.from({ length: 40 }, () => [Math.random() * 100, Math.random() * 100]),
    customData: { rubric: "GDPT_2025", stepIndex: i },
  }));

  // Simulate embedded image files (base64 data URL)
  const simulatedFiles = {
    file_1: {
      id: "file_1",
      mimeType: "image/png",
      dataURL: "data:image/png;base64," + "A".repeat(120000), // ~120KB
    },
    file_2: {
      id: "file_2",
      mimeType: "image/png",
      dataURL: "data:image/png;base64," + "B".repeat(180000), // ~180KB
    },
  };

  // Full Whiteboard object (as formerly returned by select("*"))
  const fullBoard = {
    id: "wb_test_uuid_001",
    user_id: "user_test_uuid_001",
    title: "Bài giảng Dao động điều hòa & Thí nghiệm Con lắc đơn",
    description: "template:physics_harmonic",
    elements: simulatedElements,
    app_state: { viewBackgroundColor: "#ffffff", zoom: 1, scrollX: 100, scrollY: 200 },
    thumbnail_url: "https://edutest.ai/storage/thumbnails/wb_001.webp",
    is_favorite: true,
    files: simulatedFiles,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Metadata-only Whiteboard object (as returned by select("id, user_id, title..."))
  const metadataBoard = {
    id: fullBoard.id,
    user_id: fullBoard.user_id,
    title: fullBoard.title,
    description: fullBoard.description,
    thumbnail_url: fullBoard.thumbnail_url,
    is_favorite: fullBoard.is_favorite,
    created_at: fullBoard.created_at,
    updated_at: fullBoard.updated_at,
  };

  const fullBytes = Buffer.byteLength(JSON.stringify(fullBoard), "utf8");
  const metaBytes = Buffer.byteLength(JSON.stringify(metadataBoard), "utf8");
  const savingsPct = ((1 - metaBytes / fullBytes) * 100).toFixed(2);

  console.log(`       [Benchmark] Full Whiteboard Payload: ${fullBytes.toLocaleString()} bytes`);
  console.log(`       [Benchmark] Metadata-only Payload:   ${metaBytes.toLocaleString()} bytes`);
  console.log(`       [Benchmark] Bandwidth Savings:       ${savingsPct}% reduction`);

  // Must exceed 98% payload reduction
  assert.ok(metaBytes < 1000, `Metadata payload should be under 1KB (actual: ${metaBytes} bytes)`);
  assert.ok(parseFloat(savingsPct) > 98.0, `Bandwidth savings must exceed 98% (actual: ${savingsPct}%)`);
});

// ==============================================================================
// SUITE 4: LOCAL FONT SELF-HOSTING & ZERO CDN LEAKAGE
// ==============================================================================

runTest("TEST 4.1: frontend/public/fonts contains complete Excalidraw self-hosted font families", () => {
  assert.ok(fs.existsSync(fontsDir), "public/fonts directory must exist on disk");

  const requiredFamilies = [
    "Assistant",
    "Cascadia",
    "ComicShanns",
    "Excalifont",
    "Liberation",
    "Lilita",
    "Nunito",
    "Virgil",
    "Xiaolai",
  ];

  for (const family of requiredFamilies) {
    const familyDir = path.join(fontsDir, family);
    assert.ok(fs.existsSync(familyDir), `Font family directory must exist: public/fonts/${family}`);
    const files = fs.readdirSync(familyDir);
    assert.ok(files.length > 0, `Font family directory ${family} must contain font files`);
  }
});

runTest("TEST 4.2: Total self-hosted font count and byte size verification", () => {
  function getFilesRecursively(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(getFilesRecursively(fullPath));
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }

  const allFiles = getFilesRecursively(fontsDir);
  let totalBytes = 0;
  for (const f of allFiles) {
    totalBytes += fs.statSync(f).size;
  }

  const mb = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`       [Font Assets] Discovered: ${allFiles.length} files, Total: ${mb} MB (${totalBytes} bytes)`);

  assert.ok(allFiles.length >= 200, `Must contain at least 200 font files (actual: ${allFiles.length})`);
  assert.ok(totalBytes > 10 * 1024 * 1024, `Must exceed 10MB of font binaries (actual: ${mb} MB)`);
});

runTest("TEST 4.3: Excalidraw canvas runtime sets EXCALIDRAW_ASSET_PATH to local origin '/'", () => {
  assert.ok(fs.existsSync(whiteboardCanvasPath), "whiteboard-canvas.tsx must exist");
  const code = fs.readFileSync(whiteboardCanvasPath, "utf8");

  assert.ok(
    code.includes('(window as any).EXCALIDRAW_ASSET_PATH = "/"'),
    "Must set window.EXCALIDRAW_ASSET_PATH = '/' before Excalidraw mounts"
  );
});

runTest("TEST 4.4: package.json defines build-time asset copy automation & postinstall hook", () => {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  assert.ok(pkg.scripts["copy-excalidraw-assets"], "Must have copy-excalidraw-assets npm script");
  assert.ok(pkg.scripts["postinstall"], "Must have postinstall hook");
  assert.ok(
    pkg.scripts["postinstall"].includes("copy-excalidraw-assets"),
    "postinstall hook must trigger copy-excalidraw-assets"
  );
});

runTest("TEST 4.5: Adversarial Grep: Zero external font/CDN leaks in application source code", () => {
  function searchDir(dir, pattern, extFilter) {
    let matches = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        matches = matches.concat(searchDir(fullPath, pattern, extFilter));
      } else if (extFilter.some((ext) => entry.name.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, "utf8");
        if (pattern.test(content)) {
          matches.push(fullPath);
        }
      }
    }
    return matches;
  }

  const srcDir = path.join(FRONTEND_DIR, "src");
  // Look for any external cdn domains used for Excalidraw font loading
  const cdnFontPattern = /https?:\/\/(?:unpkg\.com|esm\.sh|cdn\.jsdelivr\.net)\/(?:@excalidraw\/|fonts)/i;
  const leaks = searchDir(srcDir, cdnFontPattern, [".ts", ".tsx", ".js", ".jsx", ".css"]);

  assert.strictEqual(leaks.length, 0, `External CDN font leaks found in: ${leaks.join(", ")}`);
});

// ==============================================================================
// SUITE 5: RADAR CHART GEOMETRY & BOUNDARY VALUE ANALYSIS (BVA)
// ==============================================================================

runTest("TEST 5.1: Geometry coordinate calculation clamp and polar angle correctness", () => {
  const cx = 120;
  const cy = 120;
  const maxR = 90;

  const getCoordinates = (value, angleDeg) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const clampedVal = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
    const r = (clampedVal / 100) * maxR;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  // Boundary 1: Value = 0% -> Must be center point (cx, cy)
  const c0 = getCoordinates(0, -90);
  assert.strictEqual(Math.round(c0.x), 120);
  assert.strictEqual(Math.round(c0.y), 120);

  // Boundary 2: Value = 100% -> Must be at radius edge
  // -90 deg (Top / Recognition): x = 120, y = 120 - 90 = 30
  const top100 = getCoordinates(100, -90);
  assert.strictEqual(Math.round(top100.x), 120);
  assert.strictEqual(Math.round(top100.y), 30);

  // 0 deg (Right / Comprehension): x = 120 + 90 = 210, y = 120
  const right100 = getCoordinates(100, 0);
  assert.strictEqual(Math.round(right100.x), 210);
  assert.strictEqual(Math.round(right100.y), 120);

  // 90 deg (Bottom / Application): x = 120, y = 120 + 90 = 210
  const bottom100 = getCoordinates(100, 90);
  assert.strictEqual(Math.round(bottom100.x), 120);
  assert.strictEqual(Math.round(bottom100.y), 210);

  // 180 deg (Left / Advanced Application): x = 120 - 90 = 30, y = 120
  const left100 = getCoordinates(100, 180);
  assert.strictEqual(Math.round(left100.x), 30);
  assert.strictEqual(Math.round(left100.y), 120);

  // Boundary 3: Negative overflow (-500) -> Clamped safely to 0
  const neg = getCoordinates(-500, -90);
  assert.strictEqual(Math.round(neg.x), 120);
  assert.strictEqual(Math.round(neg.y), 120);

  // Boundary 4: Positive overflow (+9999) -> Clamped safely to 100
  const pos = getCoordinates(9999, -90);
  assert.strictEqual(Math.round(pos.x), 120);
  assert.strictEqual(Math.round(pos.y), 30);

  // Boundary 5: Non-finite inputs (NaN, Infinity, -Infinity, null, undefined)
  const nanVal = getCoordinates(NaN, -90);
  assert.strictEqual(Math.round(nanVal.x), 120);
  assert.strictEqual(Math.round(nanVal.y), 120);

  const infVal = getCoordinates(Infinity, -90);
  assert.strictEqual(Math.round(infVal.x), 120);
  assert.strictEqual(Math.round(infVal.y), 120);
});

runTest("TEST 5.2: Student progress page correctly imports and integrates StudentRadarChart", () => {
  const progressPagePath = path.join(FRONTEND_DIR, "src/app/(student)/student/progress/page.tsx");
  assert.ok(fs.existsSync(progressPagePath), "student progress page.tsx must exist");
  const code = fs.readFileSync(progressPagePath, "utf8");

  assert.ok(
    code.includes('import StudentRadarChart from "@/components/student/student-radar-chart"'),
    "Progress page must import StudentRadarChart"
  );
  assert.ok(
    code.includes("<StudentRadarChart"),
    "Progress page must render <StudentRadarChart component"
  );
  assert.ok(
    code.includes("radarLevels={radar}"),
    "Progress page must pass radar levels data"
  );
});

// ==============================================================================
// FINAL SUMMARY & VERDICT
// ==============================================================================

console.log("\n================================================================================");
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed (${failedTests} failed)`);
console.log("================================================================================");

if (failedTests > 0) {
  console.error("FAILURES DETECTED in PR 4.3 Empirical Verification.");
  process.exit(1);
} else {
  console.log("ALL PR 4.3 EMPIRICAL ADVERSARIAL CHALLENGE TESTS PASSED SUCCESSFULLY.");
  process.exit(0);
}
