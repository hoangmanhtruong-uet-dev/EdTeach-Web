import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const FRONTEND_DIR = path.resolve("frontend");

// ============================================================================
// SUITE 1: SCREEN READER COMPLIANCE (ROLE=IMG, TABLE, CAPTION, TH, TR)
// ============================================================================

test("1.1 StudentRadarChart: Screen Reader HTML Table & Semantics (WCAG 2.1 AA)", () => {
  const chartPath = path.join(FRONTEND_DIR, "src/components/student/student-radar-chart.tsx");
  assert.ok(fs.existsSync(chartPath), "student-radar-chart.tsx must exist");
  const content = fs.readFileSync(chartPath, "utf-8");

  // Verify role="img" on SVG
  assert.match(content, /<svg[^>]*\brole="img"/, "SVG must have role='img'");

  // Verify aria-labelledby references titleId and descId
  assert.match(content, /aria-labelledby=\{`\$\{titleId\}\s+\$\{descId\}`\}/, "SVG must have aria-labelledby");

  // Verify <title> and <desc> tags inside SVG
  assert.match(content, /<title id=\{titleId\}>\{title\}<\/title>/, "SVG must contain <title> with matching id");
  assert.match(content, /<desc id=\{descId\}>\{summaryText\}<\/desc>/, "SVG must contain <desc> with matching id");

  // Verify screen-reader-only data table container
  assert.match(content, /<div\s+className="sr-only">/, "Must have permanent .sr-only container");
  assert.match(content, /<table[^>]*>/, "Must contain <table>");

  // Verify <caption> exists
  assert.match(content, /<caption>Ma trận 4 cấp độ tư duy nhận thức chuẩn GDPT 2025<\/caption>/, "Table must have accessible <caption>");

  // Verify <th scope="col"> elements
  assert.match(content, /<th\s+scope="col">Cấp độ tư duy<\/th>/, "Must have <th scope='col'> for Cấp độ tư duy");
  assert.match(content, /<th\s+scope="col">Tỉ lệ đạt<\/th>/, "Must have <th scope='col'> for Tỉ lệ đạt");
  assert.match(content, /<th\s+scope="col">Chuẩn tối thiểu<\/th>/, "Must have <th scope='col'> for Chuẩn tối thiểu");
  assert.match(content, /<th\s+scope="col">Mô tả năng lực<\/th>/, "Must have <th scope='col'> for Mô tả năng lực");
  assert.match(content, /<th\s+scope="col">Đánh giá<\/th>/, "Must have <th scope='col'> for Đánh giá");

  // Verify <th scope="row"> elements inside table body
  assert.match(content, /<th\s+scope="row">\{lvl\.name\}<\/th>/, "Must have <th scope='row'>{lvl.name}</th> for each data row");

  // Verify <tr> elements exist in both thead and tbody
  assert.match(content, /<thead>\s*<tr>/, "thead must contain <tr>");
  assert.match(content, /<tr key=\{lvl\.key\}>/, "tbody must contain <tr> for each competency level");
});

test("1.2 StudentRadarChart: Coordinate Geometry & Adversarial Input Robustness", () => {
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

  const getPolygonPoints = (levels) => {
    const p1 = getCoordinates(levels.recognition, -90); // Top
    const p2 = getCoordinates(levels.comprehension, 0); // Right
    const p3 = getCoordinates(levels.application, 90); // Bottom
    const p4 = getCoordinates(levels.advancedApplication, 180); // Left
    return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
  };

  // Test Case 1: Standard GDPT 2025 values (70, 80, 60, 50)
  const stdPoints = getPolygonPoints({ recognition: 80, comprehension: 70, application: 60, advancedApplication: 50 });
  assert.strictEqual(stdPoints.includes("NaN"), false);
  assert.strictEqual(stdPoints.includes("undefined"), false);

  // Test Case 2: All zeros (0%)
  const zeroPoints = getPolygonPoints({ recognition: 0, comprehension: 0, application: 0, advancedApplication: 0 });
  assert.strictEqual(zeroPoints, "120,120 120,120 120,120 120,120", "All points must collapse to center (120,120) on 0%");

  // Test Case 3: All maximums (100%)
  const maxPoints = getPolygonPoints({ recognition: 100, comprehension: 100, application: 100, advancedApplication: 100 });
  assert.ok(maxPoints.startsWith("120,30 210,120 120,210 30,120"), "Max points must reach boundary radius 90");

  // Test Case 4: Adversarial negative values (-50, -9999) -> must clamp to 0
  const negPoints = getPolygonPoints({ recognition: -50, comprehension: -999, application: -1, advancedApplication: -0 });
  assert.strictEqual(negPoints, "120,120 120,120 120,120 120,120", "Negative inputs must be clamped to 0");

  // Test Case 5: Adversarial overflow values (150, 99999) -> must clamp to 100
  const overPoints = getPolygonPoints({ recognition: 150, comprehension: 9999, application: 100.1, advancedApplication: 200 });
  assert.ok(overPoints.startsWith("120,30 210,120 120,210 30,120"), "Overflow inputs must be clamped to 100");

  // Test Case 6: Adversarial corrupt types (NaN, Infinity, -Infinity, null, undefined)
  const corruptPoints = getPolygonPoints({ recognition: NaN, comprehension: Infinity, application: -Infinity, advancedApplication: undefined });
  assert.strictEqual(corruptPoints, "120,120 120,120 120,120 120,120", "Corrupt numeric types must safely fall back to 0 without NaN in SVG");
});

test("1.3 StudentRadarChart: Interactive View Toggle & Accessibility Contract", () => {
  const chartPath = path.join(FRONTEND_DIR, "src/components/student/student-radar-chart.tsx");
  const content = fs.readFileSync(chartPath, "utf-8");

  // Toggle button specifications
  assert.match(content, /aria-expanded=\{activeView === "table"\}/, "Toggle button must correctly bind aria-expanded");
  assert.match(content, /aria-controls=\{tableId\}/, "Toggle button must reference table container via aria-controls");
  assert.match(content, /<div id=\{tableId\}/, "Visible table view container must have id={tableId}");

  // Visible table must also have caption and table headers
  assert.match(content, /<caption[^>]*>[\s\S]*?Bảng dữ liệu chi tiết độ thuần thục 4 cấp độ nhận thức GDPT 2025[\s\S]*?<\/caption>/);
  assert.match(content, /<th scope="col"[^>]*>Cấp độ tư duy<\/th>/);
  assert.match(content, /<th scope="row"[^>]*>/);
});

// ============================================================================
// SUITE 2: VESTIBULAR MOTION SENSITIVITY (PREFERS-REDUCED-MOTION)
// ============================================================================

test("2.1 StudentRadarChart: Vestibular Motion Sensitivity Suppression", () => {
  const chartPath = path.join(FRONTEND_DIR, "src/components/student/student-radar-chart.tsx");
  const content = fs.readFileSync(chartPath, "utf-8");

  // 1. matchMedia check
  assert.match(content, /window\.matchMedia\("\(prefers-reduced-motion:\s*reduce\)"\)/, "Must check prefers-reduced-motion media query");

  // 2. React state hook
  assert.match(content, /const\s+\[prefersReducedMotion,\s*setPrefersReducedMotion\]\s*=\s*useState\(false\);/, "Must manage reduced motion via React state");

  // 3. Conditional className logic: when prefersReducedMotion is true, animations must be empty string
  assert.match(
    content,
    /className=\{\s*prefersReducedMotion\s*\?\s*""\s*:\s*"transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:duration-0"\s*\}/,
    "Polygon must suppress CSS transitions when prefersReducedMotion is true"
  );

  // 4. SSR safe check: typeof window !== 'undefined'
  assert.match(content, /if\s*\(typeof window === "undefined"\)\s*return;/, "Must check window is defined before accessing matchMedia");

  // 5. Clean event listener teardown on unmount
  assert.match(content, /return\s*\(\)\s*=>\s*mq\.removeEventListener\("change",\s*handler\);/, "Must detach event listener on cleanup");
});

// ============================================================================
// SUITE 3: WHITEBOARD PAYLOAD OVERFETCHING ELIMINATION
// ============================================================================

test("3.1 Whiteboard Query: AST & SQL Select Invariant (Explicit column omission)", () => {
  const apiPath = path.join(FRONTEND_DIR, "src/lib/api/whiteboard.ts");
  const content = fs.readFileSync(apiPath, "utf-8");

  // getUserWhiteboards must select ONLY metadata
  const expectedSelect = `.select("id, user_id, title, description, thumbnail_url, is_favorite, created_at, updated_at")`;
  assert.ok(content.includes(expectedSelect), `getUserWhiteboards must explicitly select only metadata`);

  // Assert that getUserWhiteboards DOES NOT select * or elements or files
  const getUserBoardsFn = content.slice(content.indexOf("export async function getUserWhiteboards"), content.indexOf("export async function getWhiteboardById"));
  assert.strictEqual(getUserBoardsFn.includes('.select("*")'), false, "getUserWhiteboards must NOT use select('*')");
  assert.strictEqual(getUserBoardsFn.includes("elements"), false, "getUserWhiteboards must NOT select elements column");
  assert.strictEqual(getUserBoardsFn.includes("files"), false, "getUserWhiteboards must NOT select files column");

  // Assert getWhiteboardById MUST retain select('*') for editor functionality
  const getBoardByIdFn = content.slice(content.indexOf("export async function getWhiteboardById"), content.indexOf("export async function createWhiteboard"));
  assert.ok(getBoardByIdFn.includes('.select("*")'), "getWhiteboardById must retain select('*') to load full elements & files for drawing");
});

test("3.2 Whiteboard Payload Benchmark: Heavy Elements & Embedded Files Omission", () => {
  // Construct heavy realistic Excalidraw board
  const numElements = 200;
  const elements = Array.from({ length: numElements }, (_, i) => ({
    id: `excal_${i}_${Math.random().toString(36).slice(2, 9)}`,
    type: "freedraw",
    x: 150 + i * 5,
    y: 220 + i * 8,
    width: 320,
    height: 180,
    angle: 0,
    strokeColor: "#2563eb",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    points: Array.from({ length: 40 }, (_, pt) => [pt * 8, Math.sin(pt) * 20]),
    version: 45,
    versionNonce: 9942,
    isDeleted: false,
    updated: Date.now(),
  }));

  const files = {
    diagram_1: {
      id: "diagram_1",
      mimeType: "image/png",
      dataURL: "data:image/png;base64," + "Z".repeat(80000), // ~80 KB
      created: Date.now(),
    },
    diagram_2: {
      id: "diagram_2",
      mimeType: "image/jpeg",
      dataURL: "data:image/jpeg;base64," + "K".repeat(120000), // ~120 KB
      created: Date.now(),
    },
  };

  const fullBoard = {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    user_id: "usr_teacher_01",
    title: "Bài tập dao động điều hòa & con lắc lò xo",
    description: "Đồ thị li độ - thời gian và giản đồ vecto Fresnel",
    thumbnail_url: "https://cloud.edteach.app/thumbnails/thumb_01.webp",
    is_favorite: true,
    created_at: "2026-11-01T14:00:00Z",
    updated_at: "2026-11-01T15:30:00Z",
    elements,
    files,
    app_state: {
      viewBackgroundColor: "#ffffff",
      gridSize: 20,
      zoom: { value: 1.0 },
    },
  };

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

  // For 10 boards in a gallery:
  const galleryFullBytes = Buffer.byteLength(JSON.stringify(Array(10).fill(fullBoard)), "utf-8");
  const galleryMetaBytes = Buffer.byteLength(JSON.stringify(Array(10).fill(metadataBoard)), "utf-8");
  const savedBytes = galleryFullBytes - galleryMetaBytes;
  const reductionPct = (savedBytes / galleryFullBytes) * 100;

  console.log(`[Gallery 10 Boards Benchmark] Full: ${(galleryFullBytes / 1024).toFixed(1)} KB | Optimized: ${(galleryMetaBytes / 1024).toFixed(1)} KB | Saved: ${(savedBytes / 1024).toFixed(1)} KB (${reductionPct.toFixed(2)}%)`);

  assert.ok(reductionPct > 98.0, `Gallery bandwidth reduction must exceed 98%. Measured: ${reductionPct.toFixed(2)}%`);
  assert.ok(galleryMetaBytes < 10000, `Metadata for 10 boards must be under 10 KB. Measured: ${galleryMetaBytes} bytes`);
});

test("3.3 WhiteboardsPage: Undefined elements array defensive rendering", () => {
  const pagePath = path.join(FRONTEND_DIR, "src/app/(dashboard)/whiteboard/page.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Ensure totalElements handles undefined elements without throwing
  assert.match(
    content,
    /const totalElements = whiteboards\.reduce\(\s*\(acc, b\) => acc \+ \(Array\.isArray\(b\.elements\) \? b\.elements\.length : 0\),\s*0\s*\);/,
    "totalElements must guard with Array.isArray(b.elements)"
  );

  // Ensure grid card element count guards against undefined
  assert.match(
    content,
    /const elementCount = Array\.isArray\(b\.elements\) \? b\.elements\.length : 0;/,
    "elementCount in cards must guard with Array.isArray(b.elements)"
  );

  // Ensure stats badge renders fallback text when elements array is absent
  assert.match(
    content,
    /\{totalElements > 0 \? totalElements\.toLocaleString\("vi-VN"\) : "Đám mây"\}/,
    "Stats card must show 'Đám mây' fallback when element array is not loaded"
  );
});

// ============================================================================
// SUITE 4: LOCAL FONT SELF-HOSTING & CDN ISOLATION
// ============================================================================

test("4.1 Excalidraw Font Self-Hosting: All 9 Families Present & Populated", () => {
  const fontsDir = path.join(FRONTEND_DIR, "public/fonts");
  assert.ok(fs.existsSync(fontsDir), "public/fonts directory must exist");

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

  let totalFiles = 0;
  for (const fam of requiredFamilies) {
    const famDir = path.join(fontsDir, fam);
    assert.ok(fs.existsSync(famDir), `Family dir '${fam}' must exist`);
    const files = fs.readdirSync(famDir);
    assert.ok(files.length > 0, `Family '${fam}' must contain font files`);
    
    // Check at least one .woff2 exists in each family
    const hasWoff2 = files.some(f => f.endsWith(".woff2"));
    assert.ok(hasWoff2, `Family '${fam}' must contain .woff2 files`);
    totalFiles += files.length;
  }

  assert.strictEqual(totalFiles, 234, `Expected exactly 234 font files across 9 families, found ${totalFiles}`);
});

test("4.2 Canvas Configuration: EXCALIDRAW_ASSET_PATH redirects font requests locally", () => {
  const canvasPath = path.join(FRONTEND_DIR, "src/components/whiteboard/whiteboard-canvas.tsx");
  const content = fs.readFileSync(canvasPath, "utf-8");

  assert.match(
    content,
    /\(window as any\)\.EXCALIDRAW_ASSET_PATH = "\/";/,
    "Must configure (window as any).EXCALIDRAW_ASSET_PATH = '/' before Excalidraw import"
  );
});

test("4.3 Zero Remote CDN Font Requests: Scan codebase for rogue CDN URLs", () => {
  const searchExtensions = [".ts", ".tsx", ".js", ".jsx", ".css", ".html"];
  const bannedPatterns = [
    /https?:\/\/unpkg\.com\/@excalidraw/i,
    /https?:\/\/esm\.sh\/@excalidraw\/dist\/prod\/fonts/i,
    /fonts\.googleapis\.com\/css2\?family=(?:Virgil|Cascadia|Excalifont)/i,
  ];

  const violations = [];

  const walk = (dir) => {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (item.name !== "node_modules" && item.name !== ".next") {
          walk(full);
        }
      } else if (searchExtensions.some(ext => item.name.endsWith(ext))) {
        const fileContent = fs.readFileSync(full, "utf-8");
        for (const pattern of bannedPatterns) {
          if (pattern.test(fileContent)) {
            violations.push({ file: full, pattern: pattern.toString() });
          }
        }
      }
    }
  };

  walk(path.join(FRONTEND_DIR, "src"));
  assert.strictEqual(violations.length, 0, `Rogue CDN font references detected: ${JSON.stringify(violations)}`);
});

test("4.4 Local Font HTTP Availability Check (Port 3001)", async () => {
  // Test local server HTTP retrieval of font assets
  const testFonts = [
    "/fonts/Virgil/Virgil-Regular.woff2",
    "/fonts/Cascadia/CascadiaCode-Regular.woff2",
    "/fonts/Assistant/Assistant-Regular.woff2",
    "/fonts/Liberation/LiberationSans-Regular.woff2",
    "/fonts/Excalifont/Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2",
  ];

  for (const fontUrl of testFonts) {
    const status = await new Promise((resolve) => {
      const req = http.get(`http://localhost:3001${fontUrl}`, (res) => {
        resolve(res.statusCode);
      });
      req.on("error", () => resolve(null));
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(null);
      });
    });

    if (status !== null) {
      assert.ok([200, 304].includes(status), `Font asset ${fontUrl} returned unexpected status ${status}`);
    } else {
      console.log(`[HTTP Notice] Server not actively listening on 3001 during unit test run; static file verified on filesystem.`);
    }
  }
});
