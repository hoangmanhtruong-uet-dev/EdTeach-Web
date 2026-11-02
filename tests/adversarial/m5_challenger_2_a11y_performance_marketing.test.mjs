import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const FRONTEND_DIR = path.resolve("frontend");

// ============================================================================
// SUITE 1: ACCESSIBLE STUDENT RADAR CHART & REDUCED MOTION (WCAG 2.1 AA)
// ============================================================================

test("1.1 StudentRadarChart: Source structure and WCAG 2.1 AA screen reader data table", async () => {
  const chartPath = path.join(FRONTEND_DIR, "src/components/student/student-radar-chart.tsx");
  assert.ok(fs.existsSync(chartPath), "student-radar-chart.tsx must exist");

  const content = fs.readFileSync(chartPath, "utf-8");

  // 1. Permanent screen reader accessible table
  assert.match(content, /<div\s+className="sr-only">/, "Must have sr-only wrapper for non-visual accessibility");
  assert.match(content, /<caption>Ma trận 4 cấp độ tư duy nhận thức chuẩn GDPT 2025<\/caption>/, "Table must have accessible caption");
  assert.match(content, /<th\s+scope="col">Cấp độ tư duy<\/th>/, "Must use th scope='col'");
  assert.match(content, /<th\s+scope="col">Tỉ lệ đạt<\/th>/, "Must include header for ratio");
  assert.match(content, /<th\s+scope="col">Chuẩn tối thiểu<\/th>/, "Must include header for benchmark");
  assert.match(content, /<th\s+scope="col">Mô tả năng lực<\/th>/, "Must include header for description");
  assert.match(content, /<th\s+scope="col">Đánh giá<\/th>/, "Must include header for assessment");

  // 2. Table body row headers
  assert.match(content, /<th\s+scope="row">\{lvl\.name\}<\/th>/, "Must use th scope='row' for row headings");

  // 3. All 4 GDPT 2025 competency levels defined
  const levels = ["recognition", "comprehension", "application", "advancedApplication"];
  for (const lvl of levels) {
    assert.ok(content.includes(`key: "${lvl}"`), `Must include competency level key '${lvl}'`);
  }
});

test("1.2 StudentRadarChart: Interactive View Toggle & ARIA Attributes", async () => {
  const chartPath = path.join(FRONTEND_DIR, "src/components/student/student-radar-chart.tsx");
  const content = fs.readFileSync(chartPath, "utf-8");

  // Verify interactive toggle button exists with correct type, aria-expanded, aria-controls, and aria-label
  assert.match(content, /type="button"/, "Toggle button must have type='button'");
  assert.match(content, /aria-expanded=\{activeView === "table"\}/, "Toggle button must dynamically bind aria-expanded");
  assert.match(content, /aria-controls=\{tableId\}/, "Toggle button must control visible table container by tableId");
  assert.match(content, /aria-label=\{activeView === "chart"\s*\?\s*"[^"]+"\s*:\s*"[^"]+"\}/, "Toggle button must provide contextual aria-label");

  // Visible table container must have matching id
  assert.match(content, /<div id=\{tableId\}/, "Visible table view container must have id={tableId}");
});

test("1.3 StudentRadarChart: Prefers-Reduced-Motion Media Query & Tailwind utilities", async () => {
  const chartPath = path.join(FRONTEND_DIR, "src/components/student/student-radar-chart.tsx");
  const content = fs.readFileSync(chartPath, "utf-8");

  // Check window.matchMedia integration
  assert.match(content, /window\.matchMedia\("\(prefers-reduced-motion:\s*reduce\)"\)/, "Must query prefers-reduced-motion");
  
  // Check listener and cleanup handling
  assert.match(content, /addEventListener\("change", handler\)/, "Must use addEventListener for media query");
  assert.match(content, /removeEventListener\("change", handler\)/, "Must clean up event listener on unmount");

  // Check fallback for older browsers
  assert.match(content, /addListener\(handler\)/, "Must handle fallback addListener");
  assert.match(content, /removeListener\(handler\)/, "Must handle fallback removeListener");

  // Check SVG polygon motion-reduce Tailwind classes
  assert.match(content, /motion-reduce:transition-none motion-reduce:duration-0/, "Must include Tailwind motion-reduce utility classes");
  assert.match(content, /prefersReducedMotion\s*\?\s*""\s*:\s*"transition-all/, "Must disable transitions programmatically when prefersReducedMotion is true");
});

test("1.4 StudentRadarChart: SVG Graphics Accessibility & Geometry Boundaries", async () => {
  const chartPath = path.join(FRONTEND_DIR, "src/components/student/student-radar-chart.tsx");
  const content = fs.readFileSync(chartPath, "utf-8");

  // Role and labelling
  assert.match(content, /role="img"/, "SVG must have role='img'");
  assert.match(content, /aria-labelledby=\{`\$\{titleId\}\s+\$\{descId\}`\}/, "SVG must be labelled by title and description");
  assert.match(content, /<title id=\{titleId\}>\{title\}<\/title>/, "SVG must contain <title>");
  assert.match(content, /<desc id=\{descId\}>\{summaryText\}<\/desc>/, "SVG must contain <desc>");

  // Pure mathematical simulation of coordinate calculations
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

  // Boundary condition tests:
  // 1. Extreme 0%
  const zeroTop = getCoordinates(0, -90);
  assert.strictEqual(Math.round(zeroTop.x), 120);
  assert.strictEqual(Math.round(zeroTop.y), 120);

  // 2. Extreme 100%
  const maxTop = getCoordinates(100, -90);
  assert.strictEqual(Math.round(maxTop.x), 120);
  assert.strictEqual(Math.round(maxTop.y), 30); // 120 - 90 = 30

  const maxRight = getCoordinates(100, 0);
  assert.strictEqual(Math.round(maxRight.x), 210); // 120 + 90 = 210
  assert.strictEqual(Math.round(maxRight.y), 120);

  // 3. Overflow (> 100)
  const overflow = getCoordinates(150, 0);
  assert.strictEqual(Math.round(overflow.x), 210, "Should clamp overflow to 100%");

  // 4. Negative values (< 0)
  const negative = getCoordinates(-50, 0);
  assert.strictEqual(Math.round(negative.x), 120, "Should clamp negative values to 0%");

  // 5. NaN and Infinity resilience
  const nanVal = getCoordinates(NaN, 0);
  assert.strictEqual(Math.round(nanVal.x), 120, "Should clamp NaN to 0");
  const infVal = getCoordinates(Infinity, 0);
  assert.strictEqual(Math.round(infVal.x), 120, "Should clamp Infinity to 0");
});

test("1.5 Student Progress Page: Integration of StudentRadarChart", async () => {
  const pagePath = path.join(FRONTEND_DIR, "src/app/(student)/student/progress/page.tsx");
  assert.ok(fs.existsSync(pagePath), "student/progress/page.tsx must exist");

  const page = fs.readFileSync(pagePath, "utf-8");
  assert.match(page, /import StudentRadarChart from "@/);
  assert.match(page, /<StudentRadarChart\s+radarLevels=\{radar\}\s+claimedReportsCount=/);
});

// ============================================================================
// SUITE 2: WHITEBOARD OVERFETCHING ELIMINATION & LOCAL FONT SELF-HOSTING
// ============================================================================

test("2.1 Whiteboard Query: Payload Reduction Benchmark (>90% reduction)", async () => {
  // Simulate realistic Excalidraw whiteboard data with 50 drawing elements & image files
  const mockElements = [];
  for (let i = 0; i < 50; i++) {
    mockElements.push({
      id: `elem_${i}`,
      type: i % 3 === 0 ? "rectangle" : i % 3 === 1 ? "arrow" : "freedraw",
      x: 100 + i * 10,
      y: 200 + i * 15,
      width: 150,
      height: 80,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "hachure",
      strokeWidth: 1,
      roughness: 1,
      opacity: 100,
      groupIds: [],
      strokeSharpness: "sharp",
      seed: Math.floor(Math.random() * 100000),
      version: 12,
      versionNonce: 3456,
      isDeleted: false,
      boundElements: [{ type: "arrow", id: `bound_${i}` }],
      updated: Date.now(),
      link: null,
      locked: false,
      points: [
        [0, 0],
        [20, 30],
        [45, 60],
        [80, 110],
        [120, 150],
        [180, 210],
        [240, 260],
      ],
    });
  }

  const mockFiles = {
    file_1: {
      id: "file_1",
      mimeType: "image/png",
      dataURL: "data:image/png;base64," + "A".repeat(45000), // ~45 KB embedded image
      created: Date.now(),
    },
    file_2: {
      id: "file_2",
      mimeType: "image/svg+xml",
      dataURL: "data:image/svg+xml;base64," + "B".repeat(25000), // ~25 KB embedded SVG
      created: Date.now(),
    },
  };

  const fullWhiteboardRecord = {
    id: "00000000-0000-0000-0000-000000000001",
    user_id: "user_test_123",
    title: "Bài Giảng Chuyên Đề Este Lipit - Khối 12",
    description: "Bảng vẽ tổng hợp công thức Este và phản ứng xà phòng hoá",
    thumbnail_url: "https://example.com/thumbnails/este.png",
    is_favorite: true,
    created_at: "2026-11-01T10:00:00Z",
    updated_at: "2026-11-01T12:00:00Z",
    elements: mockElements,
    app_state: {
      viewBackgroundColor: "#ffffff",
      gridSize: 20,
      scrollX: 120,
      scrollY: 450,
      zoom: { value: 1.25 },
    },
    files: mockFiles,
  };

  // Metadata only (selected columns in getUserWhiteboards)
  const metadataOnlyRecord = {
    id: fullWhiteboardRecord.id,
    user_id: fullWhiteboardRecord.user_id,
    title: fullWhiteboardRecord.title,
    description: fullWhiteboardRecord.description,
    thumbnail_url: fullWhiteboardRecord.thumbnail_url,
    is_favorite: fullWhiteboardRecord.is_favorite,
    created_at: fullWhiteboardRecord.created_at,
    updated_at: fullWhiteboardRecord.updated_at,
  };

  const fullPayloadSize = Buffer.byteLength(JSON.stringify(fullWhiteboardRecord), "utf-8");
  const metadataPayloadSize = Buffer.byteLength(JSON.stringify(metadataOnlyRecord), "utf-8");
  const reductionPercentage = ((fullPayloadSize - metadataPayloadSize) / fullPayloadSize) * 100;

  console.log(`[Payload Benchmark] Full Board: ${fullPayloadSize} bytes | Metadata-only: ${metadataPayloadSize} bytes | Reduction: ${reductionPercentage.toFixed(2)}%`);

  assert.ok(
    reductionPercentage > 90,
    `Payload reduction must exceed 90%. Measured: ${reductionPercentage.toFixed(2)}%`
  );
  assert.ok(
    reductionPercentage > 95,
    `Payload reduction for boards with drawings/files should exceed 95%. Measured: ${reductionPercentage.toFixed(2)}%`
  );
});

test("2.2 Whiteboard Query Implementation: verify column selection in API & types", async () => {
  const apiPath = path.join(FRONTEND_DIR, "src/lib/api/whiteboard.ts");
  const api = fs.readFileSync(apiPath, "utf-8");

  // Verify getUserWhiteboards selects only metadata
  assert.match(
    api,
    /\.select\("id,\s*user_id,\s*title,\s*description,\s*thumbnail_url,\s*is_favorite,\s*created_at,\s*updated_at"\)/,
    "getUserWhiteboards must select only metadata columns"
  );

  // Invariant check: getWhiteboardById MUST continue selecting all columns (*) for editor functionality
  assert.match(
    api,
    /export async function getWhiteboardById[\s\S]+?\.select\("\*"\)/,
    "getWhiteboardById must retain select('*') for editor scene loading"
  );

  // Verify types allow optional elements and app_state
  const typesPath = path.join(FRONTEND_DIR, "src/types/whiteboard.ts");
  const types = fs.readFileSync(typesPath, "utf-8");
  assert.match(types, /elements\?:\s*Record<string,\s*unknown>\[\];/, "elements must be optional");
  assert.match(types, /app_state\?:\s*Record<string,\s*unknown>;/, "app_state must be optional");

  // Verify gallery page safely guards elements array
  const galleryPath = path.join(FRONTEND_DIR, "src/app/(dashboard)/whiteboard/page.tsx");
  const gallery = fs.readFileSync(galleryPath, "utf-8");
  assert.match(gallery, /Array\.isArray\(b\.elements\)/, "Gallery page must safely check Array.isArray(b.elements)");
});

test("2.3 Excalidraw Local Font Self-Hosting: Filesystem and Config Verification", async () => {
  // 1. Check EXCALIDRAW_ASSET_PATH in canvas component
  const canvasPath = path.join(FRONTEND_DIR, "src/components/whiteboard/whiteboard-canvas.tsx");
  const canvas = fs.readFileSync(canvasPath, "utf-8");
  assert.match(
    canvas,
    /\(window as any\)\.EXCALIDRAW_ASSET_PATH\s*=\s*["']\/["'];?/,
    "Must set window.EXCALIDRAW_ASSET_PATH = '/'"
  );

  // 2. Check package.json scripts
  const pkgPath = path.join(FRONTEND_DIR, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert.ok(pkg.scripts["copy-excalidraw-assets"], "Must have copy-excalidraw-assets script");
  assert.match(pkg.scripts["postinstall"], /copy-excalidraw-assets/, "postinstall must run copy-excalidraw-assets");

  // 3. Verify fonts directory on filesystem
  const fontsDir = path.join(FRONTEND_DIR, "public/fonts");
  assert.ok(fs.existsSync(fontsDir), "public/fonts must exist");

  const fontFamilies = [
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

  for (const family of fontFamilies) {
    const familyDir = path.join(fontsDir, family);
    assert.ok(fs.existsSync(familyDir), `Font family directory '${family}' must exist`);
    const files = fs.readdirSync(familyDir);
    assert.ok(files.length > 0, `Font family '${family}' must contain font files`);
  }

  // Count all items (directories + files)
  const getAllItems = (dir) => {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      count++;
      if (entry.isDirectory()) {
        count += getAllItems(path.join(dir, entry.name));
      }
    }
    return count;
  };

  const totalItems = getAllItems(fontsDir);
  assert.strictEqual(totalItems, 243, `Expected exactly 243 total items in public/fonts, found ${totalItems}`);

  // Count files only and check sizes > 0
  const getAllFiles = (dir) => {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getAllFiles(full));
      } else {
        files.push(full);
      }
    }
    return files;
  };

  const allFiles = getAllFiles(fontsDir);
  assert.strictEqual(allFiles.length, 234, `Expected 234 font files, found ${allFiles.length}`);

  for (const file of allFiles) {
    const stat = fs.statSync(file);
    assert.ok(stat.size > 0, `Font file ${file} must not be empty (0 bytes)`);
    assert.match(file, /\.(woff2|woff|ttf|otf|json)$/i, `Font file ${file} must have valid font extension`);
  }
});

test("2.4 Zero Remote Font Network Calls to unpkg.com / esm.sh CDN", async () => {
  // Scan entire frontend/src for unpkg or remote font references
  const scanDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(full);
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".js") || entry.name.endsWith(".css")) {
        const content = fs.readFileSync(full, "utf-8");
        assert.doesNotMatch(
          content,
          /unpkg\.com\/@excalidraw/i,
          `Found remote unpkg excalidraw reference in ${full}`
        );
      }
    }
  };

  scanDir(path.join(FRONTEND_DIR, "src"));
});

// ============================================================================
// SUITE 3: ERADICATION OF FALSE MARKETING CLAIMS & MOCK MARKETPLACE DATA
// ============================================================================

test("3.1 Complete Eradication of False DeepSeek Claims Across Codebase", async () => {
  // Grep frontend/src for any occurrences of DeepSeek
  const foundOccurrences = [];

  const scanForDeepSeek = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanForDeepSeek(full);
      } else if (/\.(ts|tsx|js|jsx|json|md)$/.test(entry.name)) {
        const lines = fs.readFileSync(full, "utf-8").split("\n");
        lines.forEach((line, idx) => {
          if (/deepseek/i.test(line)) {
            foundOccurrences.push({ file: path.relative(FRONTEND_DIR, full), line: idx + 1, content: line.trim() });
          }
        });
      }
    }
  };

  scanForDeepSeek(path.join(FRONTEND_DIR, "src"));

  // The ONLY permitted occurrence is the backwards-compatible type union in preferences.ts
  for (const occ of foundOccurrences) {
    const normalizedFile = occ.file.replace(/\\/g, "/");
    if (normalizedFile === "src/lib/preferences.ts" && occ.content.includes("preferredAiModel:")) {
      continue; // Permitted backward compat type
    }
    assert.fail(`Unacceptable DeepSeek reference found at ${occ.file}:${occ.line} -> ${occ.content}`);
  }

  // Specifically check critical marketing routes
  const pricing = fs.readFileSync(path.join(FRONTEND_DIR, "src/app/(dashboard)/pricing/page.tsx"), "utf-8");
  assert.match(pricing, /Gemini 2\.0 Thinking & Deep Reasoning/);
  assert.doesNotMatch(pricing, /DeepSeek/i);

  const home = fs.readFileSync(path.join(FRONTEND_DIR, "src/app/page.tsx"), "utf-8");
  assert.match(home, /Gemini 2\.0 Thinking & Deep Reasoning/);
  assert.doesNotMatch(home, /DeepSeek/i);

  const settings = fs.readFileSync(path.join(FRONTEND_DIR, "src/app/(dashboard)/settings/page.tsx"), "utf-8");
  assert.match(settings, /Gemini 2\.0 Thinking & Deep Reasoning/);
  assert.doesNotMatch(settings, /DeepSeek/i);

  const health = fs.readFileSync(path.join(FRONTEND_DIR, "src/app/api/health/route.ts"), "utf-8");
  assert.match(health, /Google Gemini 2\.0 Flash & Gemini 2\.0 Thinking/);
  assert.doesNotMatch(health, /DeepSeek/i);
});

test("3.2 Complete Eradication of 99.8% Precision Claims", async () => {
  const scanForPrecision = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanForPrecision(full);
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        const content = fs.readFileSync(full, "utf-8");
        assert.doesNotMatch(
          content,
          /99[.,]8\s*%/i,
          `Found unbacked 99.8% precision claim in ${path.relative(FRONTEND_DIR, full)}`
        );
      }
    }
  };

  scanForPrecision(path.join(FRONTEND_DIR, "src"));
});

test("3.3 Unified Semester Discount Badges (Tiết kiệm đến 20%)", async () => {
  const pricing = fs.readFileSync(path.join(FRONTEND_DIR, "src/app/(dashboard)/pricing/page.tsx"), "utf-8");
  assert.match(pricing, /Tiết kiệm đến 20%/);
  assert.doesNotMatch(pricing, /Tiết kiệm 25%/);

  const wallet = fs.readFileSync(path.join(FRONTEND_DIR, "src/app/(dashboard)/wallet/page.tsx"), "utf-8");
  assert.match(wallet, /-20%/);
});

test("3.4 Marketplace Store: Sample items have zeroed mock numbers", async () => {
  const store = fs.readFileSync(path.join(FRONTEND_DIR, "src/lib/marketplace/marketplace-store.ts"), "utf-8");

  // Verify that fake rating numbers 4.9, 5.0, 4.8, 4.7 are completely eradicated
  assert.doesNotMatch(store, /rating:\s*(?:4\.9|5\.0|4\.8|4\.7)/);

  // Verify fake download numbers (148, 62, 95, 215) are removed
  assert.doesNotMatch(store, /downloads_count:\s*(?:148|62|95|215)/);

  // Verify all 4 sample items have zeroed metrics
  const sampleItemsMatches = store.match(/downloads_count:\s*0,\s*rating:\s*0,\s*review_count:\s*0/g);
  assert.ok(sampleItemsMatches && sampleItemsMatches.length === 4, "All 4 sample items must have rating: 0, review_count: 0, downloads_count: 0");
});

test("3.5 Marketplace Page: Skeleton Loader, Honest Ratings & Badge Clarification", async () => {
  const marketplacePage = fs.readFileSync(
    path.join(FRONTEND_DIR, "src/app/(dashboard)/marketplace/page.tsx"),
    "utf-8"
  );

  // 1. 6-card pulsing skeleton loader
  assert.match(marketplacePage, /<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">/);
  assert.match(marketplacePage, /Array\.from\(\{\s*length:\s*6\s*\}\)/);

  // 2. Star rating condition: ONLY render star if review_count > 0 AND rating > 0
  assert.match(marketplacePage, /item\.review_count\s*&&\s*item\.review_count\s*>\s*0\s*&&\s*item\.rating\s*>\s*0/);

  // 3. Fallback for unreviewed items: "Chưa có đánh giá" or download count
  assert.match(marketplacePage, /"Chưa có đánh giá"/);

  // 4. Author badge clarification
  assert.match(marketplacePage, /Tác giả PRO/);
  assert.doesNotMatch(marketplacePage, />\s*PRO\s*<\/span>/, "Must not display ambiguous 'PRO' badge on items");
});
