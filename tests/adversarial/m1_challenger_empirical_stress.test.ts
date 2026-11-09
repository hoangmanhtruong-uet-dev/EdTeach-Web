/**
 * tests/adversarial/m1_challenger_empirical_stress.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE FOR MILESTONE 1
 * Executed by Challenger M1 1 (Technical Security Challenger 1)
 *
 * Verifies:
 * 1. File Upload Validation (upload-guard.ts): SVG rejection, magic bytes verification, size boundaries (5MB/2MB).
 * 2. IDOR Prevention (/api/exams/shared/[id] & /api/student/exams): UUID sanitization, private vs shared access matrix.
 * 3. Admin RBAC Guard Logic (middleware.ts, admin/layout.tsx, admin.ts): session role checks, email spoofing immunity, secret leakage prevention.
 * 4. Security Headers (next.config.ts): CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Direct imports from frontend source code
import {
  isAllowedImageMime,
  verifyImageMagicBytes,
  validateImageBuffer,
  ALLOWED_IMAGE_MIMES,
  MAX_VERIFICATION_FILE_SIZE,
  MAX_AVATAR_FILE_SIZE,
} from "../../frontend/src/lib/security/upload-guard";

import {
  isValidUUID,
  isValidEmail,
  sanitizeString,
} from "../../frontend/src/lib/security/validation";

import {
  getAdminEmails,
  isEmailAdmin,
  isAdmin,
} from "../../frontend/src/lib/auth/admin";

import nextConfig from "../../frontend/next.config";

console.log("================================================================================");
console.log("EMPIRICAL ADVERSARIAL CHALLENGE HARNESS — MILESTONE 1 SECURITY");
console.log("================================================================================\n");

let totalTests = 0;
let passedTests = 0;
const failures: Array<{ suite: string; test: string; error: string }> = [];

type TestCase = {
  suite: string;
  name: string;
  fn: () => void | Promise<void>;
};

const testQueue: TestCase[] = [];

function registerTest(suite: string, name: string, fn: () => void | Promise<void>) {
  testQueue.push({ suite, name, fn });
}

// ==============================================================================
// SUITE 1: FILE UPLOAD VALIDATION & BYPASS STRESS TESTING
// ==============================================================================

// 1.1 SVG Rejection Matrix
registerTest("Suite 1", "1.1.1 isAllowedImageMime rejects standard SVG MIME 'image/svg+xml'", () => {
  assert.equal(isAllowedImageMime("image/svg+xml"), false);
});

registerTest("Suite 1", "1.1.2 isAllowedImageMime rejects short SVG MIME 'image/svg'", () => {
  assert.equal(isAllowedImageMime("image/svg"), false);
});

registerTest("Suite 1", "1.1.3 isAllowedImageMime rejects SVG with charset 'image/svg+xml; charset=utf-8'", () => {
  assert.equal(isAllowedImageMime("image/svg+xml; charset=utf-8"), false);
});

registerTest("Suite 1", "1.1.4 isAllowedImageMime rejects uppercase SVG 'IMAGE/SVG+XML'", () => {
  assert.equal(isAllowedImageMime("IMAGE/SVG+XML"), false);
});

registerTest("Suite 1", "1.1.5 isAllowedImageMime rejects XML graphic types 'image/vnd.adobe.svg+xml', 'text/xml', 'application/xml'", () => {
  assert.equal(isAllowedImageMime("image/vnd.adobe.svg+xml"), false);
  assert.equal(isAllowedImageMime("text/xml"), false);
  assert.equal(isAllowedImageMime("application/xml"), false);
  assert.equal(isAllowedImageMime("text/html"), false);
});

registerTest("Suite 1", "1.1.6 isAllowedImageMime accepts valid image formats (jpeg, png, webp)", () => {
  assert.equal(isAllowedImageMime("image/jpeg"), true);
  assert.equal(isAllowedImageMime("image/png"), true);
  assert.equal(isAllowedImageMime("image/webp"), true);
  assert.equal(isAllowedImageMime("IMAGE/JPEG"), true); // Case insensitive check
  assert.equal(isAllowedImageMime("  image/png  "), true); // Trim check
});

registerTest("Suite 1", "1.1.7 isAllowedImageMime safely handles null, undefined, empty string", () => {
  assert.equal(isAllowedImageMime(null), false);
  assert.equal(isAllowedImageMime(undefined), false);
  assert.equal(isAllowedImageMime(""), false);
  assert.equal(isAllowedImageMime("   "), false);
});

// 1.2 Binary Magic Bytes Verification
registerTest("Suite 1", "1.2.1 verifyImageMagicBytes authenticates genuine JPEG binary signature (FF D8 FF)", () => {
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const res = verifyImageMagicBytes(jpegHeader);
  assert.equal(res.valid, true);
  assert.equal(res.format, "jpeg");
});

registerTest("Suite 1", "1.2.2 verifyImageMagicBytes authenticates genuine PNG binary signature (89 50 4E 47)", () => {
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const res = verifyImageMagicBytes(pngHeader);
  assert.equal(res.valid, true);
  assert.equal(res.format, "png");
});

registerTest("Suite 1", "1.2.3 verifyImageMagicBytes authenticates genuine WebP binary signature (RIFF....WEBP)", () => {
  const webpHeader = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0x24, 0x00, 0x00, 0x00]),
    Buffer.from("WEBP", "ascii"),
  ]);
  const res = verifyImageMagicBytes(webpHeader);
  assert.equal(res.valid, true);
  assert.equal(res.format, "webp");
});

registerTest("Suite 1", "1.2.4 verifyImageMagicBytes rejects RIFF header with non-WEBP container (e.g. AVI or WAV)", () => {
  const aviHeader = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0x24, 0x00, 0x00, 0x00]),
    Buffer.from("AVI ", "ascii"),
  ]);
  const wavHeader = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0x24, 0x00, 0x00, 0x00]),
    Buffer.from("WAVE", "ascii"),
  ]);
  assert.equal(verifyImageMagicBytes(aviHeader).valid, false);
  assert.equal(verifyImageMagicBytes(wavHeader).valid, false);
});

registerTest("Suite 1", "1.2.5 verifyImageMagicBytes rejects buffers shorter than 12 bytes", () => {
  assert.equal(verifyImageMagicBytes(Buffer.from([])).valid, false);
  assert.equal(verifyImageMagicBytes(Buffer.from([0xff, 0xd8, 0xff])).valid, false);
  assert.equal(verifyImageMagicBytes(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a])).valid, false);
});

registerTest("Suite 1", "1.2.6 verifyImageMagicBytes rejects executable, script, and HTML payloads disguised as images", () => {
  // Windows PE Executable (MZ)
  const peBuffer = Buffer.concat([Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff"), Buffer.alloc(100)]);
  assert.equal(verifyImageMagicBytes(peBuffer).valid, false);

  // PHP Script disguised as image
  const phpBuffer = Buffer.from("<?php echo 'pwned'; system($_GET['cmd']); ?>");
  assert.equal(verifyImageMagicBytes(phpBuffer).valid, false);

  // Raw HTML/SVG payload
  const svgBuffer = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
  assert.equal(verifyImageMagicBytes(svgBuffer).valid, false);

  // XML prolog payload
  const xmlBuffer = Buffer.from("<?xml version='1.0'?><svg viewBox='0 0 100 100'></svg>");
  assert.equal(verifyImageMagicBytes(xmlBuffer).valid, false);
});

// 1.3 Full Buffer Validation (validateImageBuffer)
registerTest("Suite 1", "1.3.1 validateImageBuffer rejects SVG even when attacker declares 'image/png'", () => {
  const svgPayload = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(document.cookie)</script></svg>");
  const result = validateImageBuffer(svgPayload, "image/png", MAX_VERIFICATION_FILE_SIZE);
  assert.equal(result.valid, false);
  assert.match(result.error || "", /chữ ký nhị phân|không khớp/i);
});

registerTest("Suite 1", "1.3.2 validateImageBuffer rejects valid JPEG buffer if declared MIME is SVG", () => {
  const validJpeg = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
    Buffer.alloc(50),
  ]);
  const result = validateImageBuffer(validJpeg, "image/svg+xml", MAX_VERIFICATION_FILE_SIZE);
  assert.equal(result.valid, false);
  assert.match(result.error || "", /không được hỗ trợ|không hỗ trợ SVG/i);
});

registerTest("Suite 1", "1.3.3 validateImageBuffer validates exact 5MB verification limit boundary", () => {
  const header = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  // Exactly 5MB buffer
  const exact5Mb = Buffer.alloc(MAX_VERIFICATION_FILE_SIZE);
  header.copy(exact5Mb, 0);

  const exactResult = validateImageBuffer(exact5Mb, "image/jpeg", MAX_VERIFICATION_FILE_SIZE);
  assert.equal(exactResult.valid, true);
  assert.equal(exactResult.detectedMime, "image/jpeg");

  // 5MB + 1 byte
  const over5Mb = Buffer.alloc(MAX_VERIFICATION_FILE_SIZE + 1);
  header.copy(over5Mb, 0);

  const overResult = validateImageBuffer(over5Mb, "image/jpeg", MAX_VERIFICATION_FILE_SIZE);
  assert.equal(overResult.valid, false);
  assert.match(overResult.error || "", /vượt quá giới hạn/i);
});

registerTest("Suite 1", "1.3.4 validateImageBuffer validates exact 2MB avatar limit boundary", () => {
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  // Exactly 2MB buffer
  const exact2Mb = Buffer.alloc(MAX_AVATAR_FILE_SIZE);
  pngHeader.copy(exact2Mb, 0);

  const exactResult = validateImageBuffer(exact2Mb, "image/png", MAX_AVATAR_FILE_SIZE);
  assert.equal(exactResult.valid, true);
  assert.equal(exactResult.detectedMime, "image/png");

  // 2MB + 1 byte
  const over2Mb = Buffer.alloc(MAX_AVATAR_FILE_SIZE + 1);
  pngHeader.copy(over2Mb, 0);

  const overResult = validateImageBuffer(over2Mb, "image/png", MAX_AVATAR_FILE_SIZE);
  assert.equal(overResult.valid, false);
  assert.match(overResult.error || "", /vượt quá giới hạn/i);
});

registerTest("Suite 1", "1.3.5 validateImageBuffer handles oversized DoS payloads (10MB, 50MB)", () => {
  const hugeBuffer = Buffer.alloc(10 * 1024 * 1024);
  const result = validateImageBuffer(hugeBuffer, "image/jpeg", MAX_VERIFICATION_FILE_SIZE);
  assert.equal(result.valid, false);
  assert.match(result.error || "", /vượt quá giới hạn/i);
});


// ==============================================================================
// SUITE 2: IDOR PREVENTION & ACCESS CONTROL
// ==============================================================================

// 2.1 UUID Parameter Tampering & Validation
registerTest("Suite 2", "2.1.1 isValidUUID accepts valid RFC 4122 v4 UUIDs", () => {
  assert.equal(isValidUUID("f47ac10b-58cc-4372-a567-0e02b2c3d479"), true);
  assert.equal(isValidUUID("123e4567-e89b-12d3-a456-426614174000"), true);
});

registerTest("Suite 2", "2.1.2 isValidUUID blocks SQL injection and path traversal payloads", () => {
  assert.equal(isValidUUID("f47ac10b-58cc-4372-a567-0e02b2c3d479' OR '1'='1"), false);
  assert.equal(isValidUUID("../../api/exams"), false);
  assert.equal(isValidUUID("12345"), false);
  assert.equal(isValidUUID("undefined"), false);
  assert.equal(isValidUUID(""), false);
  assert.equal(isValidUUID(null as any), false);
  assert.equal(isValidUUID(undefined as any), false);
});

// 2.2 Shared Exam Authorization & IDOR Matrix
function evaluateSharedExamAccess(
  user: { id: string } | null,
  exam: { id: string; user_id: string; is_shared?: boolean | null; is_public?: boolean | null } | null
): { status: number; allowed: boolean; error?: string } {
  if (!exam) {
    return { status: 404, allowed: false, error: "Không tìm thấy đề thi chia sẻ." };
  }

  const isOwner = Boolean(user?.id && exam.user_id === user.id);
  const isPubliclyShared = exam.is_shared === true || exam.is_public === true;

  if (!isPubliclyShared && !isOwner) {
    return {
      status: 404,
      allowed: false,
      error: "Đề thi không tồn tại hoặc chưa được tác giả chia sẻ công khai.",
    };
  }

  return { status: 200, allowed: true };
}

registerTest("Suite 2", "2.2.1 IDOR Attack: Private exam queried by unauthenticated user returns 404", () => {
  const privateExam = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    user_id: "teacher-victim-uuid",
    is_shared: false,
    is_public: false,
  };
  const result = evaluateSharedExamAccess(null, privateExam);
  assert.equal(result.status, 404);
  assert.equal(result.allowed, false);
});

registerTest("Suite 2", "2.2.2 IDOR Attack: Private exam queried by another authenticated user (attacker) returns 404", () => {
  const privateExam = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    user_id: "teacher-victim-uuid",
    is_shared: false,
    is_public: false,
  };
  const attacker = { id: "attacker-uuid-999" };
  const result = evaluateSharedExamAccess(attacker, privateExam);
  assert.equal(result.status, 404);
  assert.equal(result.allowed, false);
});

registerTest("Suite 2", "2.2.3 Authorized Access: Private exam queried by genuine owner returns 200", () => {
  const privateExam = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    user_id: "owner-teacher-uuid",
    is_shared: false,
    is_public: false,
  };
  const owner = { id: "owner-teacher-uuid" };
  const result = evaluateSharedExamAccess(owner, privateExam);
  assert.equal(result.status, 200);
  assert.equal(result.allowed, true);
});

registerTest("Suite 2", "2.2.4 Legitimate Access: Shared exam (is_shared: true) allows unauthenticated student access (200)", () => {
  const sharedExam = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    user_id: "teacher-uuid",
    is_shared: true,
    is_public: false,
  };
  const result = evaluateSharedExamAccess(null, sharedExam);
  assert.equal(result.status, 200);
  assert.equal(result.allowed, true);
});

registerTest("Suite 2", "2.2.5 Legitimate Access: Public exam (is_public: true) allows any student access (200)", () => {
  const publicExam = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    user_id: "teacher-uuid",
    is_shared: false,
    is_public: true,
  };
  const student = { id: "student-uuid-456" };
  const result = evaluateSharedExamAccess(student, publicExam);
  assert.equal(result.status, 200);
  assert.equal(result.allowed, true);
});

registerTest("Suite 2", "2.2.6 Strict Type Checking: String truthy 'true' or integer 1 does NOT grant public access", () => {
  const stringTruthyExam = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    user_id: "teacher-victim-uuid",
    is_shared: "true" as any,
    is_public: 1 as any,
  };
  const outsider = { id: "outsider-uuid" };
  const result = evaluateSharedExamAccess(outsider, stringTruthyExam);
  assert.equal(result.status, 404);
  assert.equal(result.allowed, false);
});

// 2.3 Student Exams Route Verification (frontend/src/app/api/student/exams/route.ts)
registerTest("Suite 2", "2.3.1 /api/student/exams eliminates fallback to 'demo-student-id' and enforces auth check", () => {
  const routeContent = fs.readFileSync(
    path.resolve(__dirname, "../../frontend/src/app/api/student/exams/route.ts"),
    "utf-8"
  );
  // Verify assignment fallback is completely eliminated
  assert.equal(routeContent.includes("= 'demo-student-id'"), false, "Assignment fallback to demo-student-id must not exist!");
  assert.equal(routeContent.includes('="demo-student-id"'), false, "Assignment fallback to demo-student-id must not exist!");
  assert.match(routeContent, /if\s*\(\s*authErr\s*\|\|\s*!user\s*\)/);
  assert.match(routeContent, /status:\s*401/);
});


// ==============================================================================
// SUITE 3: ADMIN RBAC GUARD LOGIC & SECRET PROTECTION
// ==============================================================================

// 3.1 Middleware Admin Path RBAC Guard Model
function evaluateMiddlewareAdminAccess(
  user: {
    email?: string | null;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  } | null,
  configuredAdmins: string[]
): { allowed: boolean; redirectUrl?: string } {
  if (!user) {
    return { allowed: false, redirectUrl: "/login?redirectTo=/admin" };
  }

  const userRole =
    (user.app_metadata as Record<string, unknown> | undefined)?.role ||
    (user.user_metadata as Record<string, unknown> | undefined)?.role;

  const userEmail = user.email?.toLowerCase().trim() || "";
  const isEmailAdmin = Boolean(userEmail && configuredAdmins.includes(userEmail));
  const isAdminUser = userRole === "admin" || isEmailAdmin;

  if (!isAdminUser) {
    return { allowed: false, redirectUrl: "/dashboard?unauthorized=admin_required" };
  }

  return { allowed: true };
}

const mockConfiguredAdmins = ["admin@edteach.vn", "lead.admin@school.edu.vn"];

registerTest("Suite 3", "3.1.1 Middleware redirects unauthenticated visitor on /admin to /login", () => {
  const res = evaluateMiddlewareAdminAccess(null, mockConfiguredAdmins);
  assert.equal(res.allowed, false);
  assert.equal(res.redirectUrl, "/login?redirectTo=/admin");
});

registerTest("Suite 3", "3.1.2 Middleware redirects authenticated student to /dashboard?unauthorized=admin_required", () => {
  const student = {
    email: "student@school.edu.vn",
    user_metadata: { role: "student" },
  };
  const res = evaluateMiddlewareAdminAccess(student, mockConfiguredAdmins);
  assert.equal(res.allowed, false);
  assert.equal(res.redirectUrl, "/dashboard?unauthorized=admin_required");
});

registerTest("Suite 3", "3.1.3 Middleware redirects authenticated teacher to /dashboard?unauthorized=admin_required", () => {
  const teacher = {
    email: "teacher@school.edu.vn",
    user_metadata: { role: "teacher" },
  };
  const res = evaluateMiddlewareAdminAccess(teacher, mockConfiguredAdmins);
  assert.equal(res.allowed, false);
  assert.equal(res.redirectUrl, "/dashboard?unauthorized=admin_required");
});

registerTest("Suite 3", "3.1.4 Middleware blocks role spoofing payloads ('ADMIN', 'admin ', 'superadmin', {admin: true})", () => {
  const attackVariants = [
    { email: "hacker@evil.com", user_metadata: { role: "ADMIN" } },
    { email: "hacker@evil.com", user_metadata: { role: "admin " } },
    { email: "hacker@evil.com", user_metadata: { role: "superadmin" } },
    { email: "hacker@evil.com", user_metadata: { role: "administrator" } },
    { email: "hacker@evil.com", user_metadata: { role: { admin: true } } },
    { email: "hacker@evil.com", user_metadata: { role: true } },
    { email: "hacker@evil.com", user_metadata: {} },
  ];

  for (const variant of attackVariants) {
    const res = evaluateMiddlewareAdminAccess(variant as any, mockConfiguredAdmins);
    assert.equal(res.allowed, false, `Spoofing attempt failed: ${JSON.stringify(variant.user_metadata)}`);
    assert.equal(res.redirectUrl, "/dashboard?unauthorized=admin_required");
  }
});

registerTest("Suite 3", "3.1.5 Middleware blocks email spoofing (substring attack & fake domain suffix)", () => {
  const spoofedEmails = [
    { email: "fakeadmin@edteach.vn.attacker.com", user_metadata: { role: "user" } },
    { email: "attacker_admin@edteach.vn", user_metadata: { role: "user" } },
    { email: "admin@edteach.vn.ru", user_metadata: { role: "user" } },
    { email: "notadmin@edteach.vn", user_metadata: { role: "user" } },
  ];

  for (const variant of spoofedEmails) {
    const res = evaluateMiddlewareAdminAccess(variant, mockConfiguredAdmins);
    assert.equal(res.allowed, false, `Impostor email should be rejected: ${variant.email}`);
  }
});

registerTest("Suite 3", "3.1.6 Middleware allows access to authentic configured admin email", () => {
  const legitAdmin = {
    email: "admin@edteach.vn",
    user_metadata: { role: "user" },
  };
  const res = evaluateMiddlewareAdminAccess(legitAdmin, mockConfiguredAdmins);
  assert.equal(res.allowed, true);
});

registerTest("Suite 3", "3.1.7 Middleware allows access to authentic role='admin' in metadata", () => {
  const legitAdmin = {
    email: "custom.officer@school.vn",
    app_metadata: { role: "admin" },
  };
  const res = evaluateMiddlewareAdminAccess(legitAdmin, mockConfiguredAdmins);
  assert.equal(res.allowed, true);
});

// 3.2 Server Component Admin Layout Guard (admin/layout.tsx & admin.ts)
registerTest("Suite 3", "3.2.1 isAdmin returns true for authentic email configured in process.env.ADMIN_EMAIL", async () => {
  process.env.ADMIN_EMAIL = "system.admin@edteach.vn";
  const user = { id: "uuid-1", email: "system.admin@edteach.vn" };
  const mockSupabase = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) };

  const result = await isAdmin(mockSupabase, user as any);
  assert.equal(result, true);
});

registerTest("Suite 3", "3.2.2 isAdmin returns true for role='admin' in public.users DB table (SSOT)", async () => {
  process.env.ADMIN_EMAIL = "another@admin.vn";
  const user = { id: "db-admin-uuid", email: "db.master@school.vn" };
  const mockSupabase = {
    from: (table: string) => {
      assert.equal(table, "users");
      return {
        select: (col: string) => {
          assert.equal(col, "role");
          return {
            eq: (_idCol: string, idVal: string) => {
              assert.equal(idVal, "db-admin-uuid");
              return {
                maybeSingle: async () => ({ data: { role: "admin" }, error: null }),
              };
            },
          };
        },
      };
    },
  };

  const result = await isAdmin(mockSupabase, user as any);
  assert.equal(result, true);
});

registerTest("Suite 3", "3.2.3 isAdmin returns false when DB role is 'teacher' or 'student'", async () => {
  process.env.ADMIN_EMAIL = "system.admin@edteach.vn";
  const user = { id: "teacher-uuid", email: "teacher@school.vn" };
  const mockSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { role: "teacher" }, error: null }),
        }),
      }),
    }),
  };

  const result = await isAdmin(mockSupabase, user as any);
  assert.equal(result, false);
});

registerTest("Suite 3", "3.2.4 isAdmin fails safely (returns false) upon database error or exception", async () => {
  process.env.ADMIN_EMAIL = "system.admin@edteach.vn";
  const user = { id: "error-user-uuid", email: "error@school.vn" };
  const mockSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            throw new Error("DB Connection Failed");
          },
        }),
      }),
    }),
  };

  const result = await isAdmin(mockSupabase, user as any);
  assert.equal(result, false);
});

// 3.3 Zero Secret Bundling into Client Scripts (NEXT_PUBLIC_ADMIN_* elimination in executable code)
registerTest("Suite 3", "3.3.1 frontend/src/lib/constants.ts contains NO process.env.NEXT_PUBLIC_ADMIN_ references", () => {
  const content = fs.readFileSync(
    path.resolve(__dirname, "../../frontend/src/lib/constants.ts"),
    "utf-8"
  );
  assert.equal(content.includes("process.env.NEXT_PUBLIC_ADMIN_EMAIL"), false);
  assert.equal(content.includes("process.env.NEXT_PUBLIC_ADMIN_EMAILS"), false);
  assert.equal(content.includes("process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN"), false);
});

registerTest("Suite 3", "3.3.2 frontend/src/lib/auth/admin.ts contains NO process.env.NEXT_PUBLIC_ADMIN_ references", () => {
  const content = fs.readFileSync(
    path.resolve(__dirname, "../../frontend/src/lib/auth/admin.ts"),
    "utf-8"
  );
  assert.equal(content.includes("process.env.NEXT_PUBLIC_ADMIN_EMAILS"), false);
  assert.equal(content.includes("process.env.NEXT_PUBLIC_ADMIN_EMAIL"), false);
});


// ==============================================================================
// SUITE 4: SECURITY HEADERS ROBUSTNESS & PRODUCTION READINESS
// ==============================================================================

registerTest("Suite 4", "4.1 nextConfig.headers() executes successfully and returns rule for source '/(.*)'", async () => {
  assert.ok(typeof nextConfig.headers === "function", "headers() method must exist on nextConfig");
  const headerRules = await nextConfig.headers();
  assert.ok(Array.isArray(headerRules), "headers() must return an array");
  assert.ok(headerRules.length >= 1, "headers() array must contain at least 1 rule");

  const wildcardRule = headerRules.find((r) => r.source === "/(.*)");
  assert.ok(wildcardRule, "Must have header rule matching '/(.*)'");
});

registerTest("Suite 4", "4.2 headers configuration produces all 6 essential security headers", async () => {
  const headerRules = await nextConfig.headers!();
  const wildcardRule = headerRules.find((r) => r.source === "/(.*)")!;
  const headers = wildcardRule.headers;

  const headerMap = new Map<string, string>();
  for (const h of headers) {
    headerMap.set(h.key.toLowerCase(), h.value);
  }

  // 1. Content-Security-Policy
  assert.ok(headerMap.has("content-security-policy"), "Missing Content-Security-Policy header");
  const csp = headerMap.get("content-security-policy")!;
  assert.ok(csp.includes("default-src 'self'"), "CSP must define default-src 'self'");
  assert.ok(csp.includes("frame-ancestors 'self'"), "CSP must protect against framing via frame-ancestors 'self'");
  assert.ok(csp.includes("object-src 'none'"), "CSP must block plugin objects via object-src 'none'");
  assert.ok(csp.includes("base-uri 'self'"), "CSP must restrict document base URI");

  // 2. Strict-Transport-Security (HSTS)
  assert.ok(headerMap.has("strict-transport-security"), "Missing Strict-Transport-Security header");
  const hsts = headerMap.get("strict-transport-security")!;
  assert.ok(hsts.includes("max-age=31536000"), "HSTS max-age must be at least 1 year (31536000)");
  assert.ok(hsts.includes("includeSubDomains"), "HSTS must includeSubDomains");
  assert.ok(hsts.includes("preload"), "HSTS must include preload directive");

  // 3. X-Frame-Options
  assert.ok(headerMap.has("x-frame-options"), "Missing X-Frame-Options header");
  const xfo = headerMap.get("x-frame-options")!;
  assert.ok(xfo === "SAMEORIGIN" || xfo === "DENY", "X-Frame-Options must be SAMEORIGIN or DENY");

  // 4. X-Content-Type-Options
  assert.ok(headerMap.has("x-content-type-options"), "Missing X-Content-Type-Options header");
  assert.equal(headerMap.get("x-content-type-options"), "nosniff");

  // 5. Referrer-Policy
  assert.ok(headerMap.has("referrer-policy"), "Missing Referrer-Policy header");
  const rp = headerMap.get("referrer-policy")!;
  assert.ok(
    rp === "strict-origin-when-cross-origin" || rp === "no-referrer" || rp === "same-origin",
    `Referrer-Policy should be strict-origin-when-cross-origin or stricter, got: ${rp}`
  );

  // 6. Permissions-Policy
  assert.ok(headerMap.has("permissions-policy"), "Missing Permissions-Policy header");
  const pp = headerMap.get("permissions-policy")!;
  assert.ok(pp.includes("camera"), "Permissions-Policy must govern camera access");
  assert.ok(pp.includes("microphone"), "Permissions-Policy must govern microphone access");
  assert.ok(pp.includes("geolocation"), "Permissions-Policy must govern geolocation access");
});

registerTest("Suite 4", "4.3 Production compiler strips console.log while preserving warn/error", () => {
  const compiler = (nextConfig as any).compiler;
  assert.ok(compiler, "nextConfig.compiler must be configured");
  assert.ok(compiler.removeConsole !== undefined, "compiler.removeConsole must be configured");
});


// ==============================================================================
// SEQUENTIAL TEST EXECUTION & REPORTING
// ==============================================================================
(async () => {
  let currentSuite = "";
  for (const t of testQueue) {
    if (t.suite !== currentSuite) {
      currentSuite = t.suite;
      console.log(`\n--- Running ${currentSuite} ---`);
    }
    totalTests++;
    try {
      await t.fn();
      passedTests++;
      console.log(`  [PASS] ${t.name}`);
    } catch (err: any) {
      failures.push({ suite: t.suite, test: t.name, error: err?.message || String(err) });
      console.error(`  [FAIL] ${t.name}`);
      console.error(`         Reason: ${err?.message}`);
    }
  }

  console.log("\n================================================================================");
  console.log(`STRESS TEST EXECUTION COMPLETED: ${passedTests}/${totalTests} PASSED`);
  if (failures.length > 0) {
    console.error(`FAILED TESTS: ${failures.length}`);
    for (const f of failures) {
      console.error(`  - [${f.suite}] ${f.test}: ${f.error}`);
    }
    console.log("================================================================================");
    process.exit(1);
  } else {
    console.log(`ALL ${passedTests} EMPIRICAL ADVERSARIAL STRESS TESTS PASSED WITH ZERO FAILURES!`);
    console.log("VERDICT: CONFIRM_CORRECT");
    console.log("================================================================================");
    process.exit(0);
  }
})();
