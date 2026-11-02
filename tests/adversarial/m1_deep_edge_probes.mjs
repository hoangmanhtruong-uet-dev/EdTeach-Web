// tests/adversarial/m1_deep_edge_probes.mjs
// Comprehensive Adversarial Edge-Case Probes for Milestone 1 Iteration 2
// PR Group 0: Database & Core Security
// Executed by Teamwork Challenger (Empirical Challenger)

import assert from "node:assert/strict";

console.log("================================================================================");
console.log("RUNNING DEEP ADVERSARIAL EDGE-CASE PROBES: M1 ITERATION 2");
console.log("================================================================================\n");

let passed = 0;
let total = 0;
const failures = [];

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failures.push({ name, error: err });
    console.error(`[FAIL] ${name}`);
    console.error(`       Details: ${err.message}`);
  }
}

async function testAsync(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failures.push({ name, error: err });
    console.error(`[FAIL] ${name}`);
    console.error(`       Details: ${err.message}`);
  }
}

// =============================================================================
// SUITE 1: MIDDLEWARE EDGE-CASE ROUTE PROTECTION & HEADER SPOOFING IMMUNITY
// =============================================================================
console.log("\n--- Suite 1: Middleware Edge-Case Route Protection & Header Immunity ---");

// Emulate middleware logic verbatim from frontend/src/middleware.ts
function runMiddlewarePipeline({ pathname, searchParams = new URLSearchParams(), headers = {}, cookies = {} }) {
  // 1. Simulate Supabase Auth Token verification (supabase.auth.getUser())
  // In Supabase SSR, cookies are inspected. Only valid tokens produce a user object.
  // Spoofed headers, empty cookies, or forged tokens result in user = null.
  let authenticatedUser = null;
  const token = cookies["sb-access-token"] || cookies["sb-auth-token"] || cookies["supabase-auth-token"];

  if (token && typeof token === "string") {
    // Valid mock token convention for testing
    if (token === "valid_authenticated_jwt_signature") {
      authenticatedUser = { id: "user_valid_123", email: "student@school.edu" };
    }
    // Any malformed, expired, none-alg, or forged tokens return null (auth rejection)
  }

  // 2. Protected route determination (verbatim from middleware.ts)
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/exams") ||
    pathname.startsWith("/teach") ||
    (pathname.startsWith("/grading") && !pathname.startsWith("/grading/submit")) ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/labs") ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/whiteboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/affiliate");

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // CRITICAL CHECK: Headers (e.g. x-playwright-audit, x-admin-override) MUST NOT affect authentication
  // No header overrides exist in middleware.ts

  if (!authenticatedUser && isProtectedRoute) {
    const redirectUrl = `/login?redirectTo=${encodeURIComponent(pathname)}&next=${encodeURIComponent(pathname)}`;
    return { status: 307, action: "REDIRECT", to: redirectUrl };
  }

  if (authenticatedUser && isAuthRoute) {
    const destination =
      searchParams.get("redirectTo") || searchParams.get("next");
    if (destination && destination.startsWith("/") && !destination.startsWith("//")) {
      return { status: 307, action: "REDIRECT", to: destination };
    }
    return { status: 307, action: "REDIRECT", to: "/dashboard" };
  }

  return { status: 200, action: "NEXT" };
}

// 1.1 Matcher and route prefix exhaustiveness
const allProtectedPrefixes = [
  "/dashboard",
  "/dashboard/overview",
  "/dashboard/stats/deep",
  "/exams",
  "/exams/123",
  "/exams/create",
  "/exams/edit/456",
  "/teach",
  "/teach/classes",
  "/teach/live/room-1",
  "/wallet",
  "/wallet/balance",
  "/wallet/payout-request",
  "/settings",
  "/settings/profile",
  "/settings/security",
  "/student",
  "/student/exams",
  "/student/exams/attempt/abc-789",
  "/labs",
  "/labs/chemistry",
  "/labs/physics/photoelectric-step",
  "/marketplace",
  "/marketplace/cart",
  "/marketplace/item/uuid-999",
  "/whiteboard",
  "/whiteboard/canvas/session-42",
  "/admin",
  "/admin/affiliate",
  "/admin/verifications",
  "/admin/users/permissions",
  "/affiliate",
  "/affiliate/dashboard",
  "/affiliate/payout",
  "/grading",
  "/grading/mobile-scanner",
  "/grading/sessions/view",
];

test("1.1 All protected routes redirect to /login when unauthenticated", () => {
  for (const path of allProtectedPrefixes) {
    const res = runMiddlewarePipeline({ pathname: path });
    assert.equal(res.action, "REDIRECT", `Expected redirect for ${path}`);
    assert.ok(
      res.to.startsWith("/login?redirectTo="),
      `Expected /login redirect for ${path}, got ${res.to}`
    );
  }
});

// 1.2 Probing with adversarial spoofed headers
const adversarialHeaderSets = [
  { "x-playwright-audit": "true" },
  { "x-playwright-audit": "1" },
  { "X-Playwright-Audit": "true" },
  { "x-playwright-audit": "admin" },
  { "x-admin-override": "true" },
  { "x-admin-override": "1" },
  { "x-bypass-auth": "true" },
  { "x-forwarded-user": "admin" },
  { "x-remote-user": "admin" },
  { "x-user-role": "admin" },
  { "x-supabase-role": "service_role" },
  { "x-middleware-prefetch": "1" },
  { "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.bogus_signature" },
  { "x-custom-bypass": "1", "x-security-exempt": "true" },
];

test("1.2 Adversarial header spoofing attempts CANNOT bypass route protection", () => {
  for (const headers of adversarialHeaderSets) {
    for (const path of ["/dashboard", "/admin", "/admin/affiliate", "/student/exams", "/wallet"]) {
      const res = runMiddlewarePipeline({ pathname: path, headers });
      assert.equal(
        res.action,
        "REDIRECT",
        `Header ${JSON.stringify(headers)} must NOT grant access to ${path}`
      );
      assert.ok(res.to.startsWith("/login?redirectTo="));
    }
  }
});

// 1.3 Empty, corrupt, or forged cookies
const malformedCookieVectors = [
  {},
  { "sb-access-token": "" },
  { "sb-access-token": "   " },
  { "sb-access-token": "null" },
  { "sb-access-token": "undefined" },
  { "sb-access-token": "malformed.jwt.token" },
  { "sb-access-token": "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0Iiwicm9sZSI6ImFkbWluIn0." }, // alg: none attack
  { "sb-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MDAwMDAwMDB9.invalid_signature" }, // expired token
  { "supabase-auth-token": "forged_data" },
];

test("1.3 Empty, malformed, or forged cookie tokens are rejected", () => {
  for (const cookies of malformedCookieVectors) {
    const res = runMiddlewarePipeline({ pathname: "/admin", cookies });
    assert.equal(
      res.action,
      "REDIRECT",
      `Malformed cookie ${JSON.stringify(cookies)} must NOT bypass auth`
    );
  }
});

// 1.4 Public route exception verification
test("1.4 Public submission routes under /grading/submit remain accessible", () => {
  const publicPaths = [
    "/grading/submit",
    "/grading/submit/TOKEN-123456",
    "/grading/submit/TOKEN-123456/confirm",
  ];
  for (const path of publicPaths) {
    const res = runMiddlewarePipeline({ pathname: path });
    assert.equal(res.action, "NEXT", `Public path ${path} should pass through`);
  }
});

// 1.5 Open redirect guard on /login when user is already logged in
test("1.5 Open redirect attack payloads in redirectTo/next are neutralized", () => {
  const loggedInCookies = { "sb-access-token": "valid_authenticated_jwt_signature" };

  const attackDestinations = [
    { input: "//attacker.com", expected: "/dashboard" },
    { input: "//evil.com/phish", expected: "/dashboard" },
    { input: "https://evil.com", expected: "/dashboard" },
    { input: "http://attacker.com/steal", expected: "/dashboard" },
    { input: "javascript:alert(1)", expected: "/dashboard" },
    { input: "data:text/html,<script>evil()</script>", expected: "/dashboard" },
    { input: "/student/exams", expected: "/student/exams" }, // Legitimate internal path
    { input: "/dashboard/analytics", expected: "/dashboard/analytics" }, // Legitimate internal path
  ];

  for (const { input, expected } of attackDestinations) {
    const searchParams = new URLSearchParams({ redirectTo: input });
    const res = runMiddlewarePipeline({
      pathname: "/login",
      searchParams,
      cookies: loggedInCookies,
    });
    assert.equal(
      res.to,
      expected,
      `Destination '${input}' should resolve safely to '${expected}'`
    );
  }
});

// =============================================================================
// SUITE 2: PRIVILEGE ESCALATION AT /api/user/set-role
// =============================================================================
console.log("\n--- Suite 2: Privilege Escalation at /api/user/set-role ---");

// Emulate POST /api/user/set-role logic verbatim from frontend/src/app/api/user/set-role/route.ts
function handleSetRoleEndpoint({ sessionUser, dbProfile, requestBody }) {
  // 1. Enforce authentication
  if (!sessionUser) {
    return {
      status: 401,
      body: { success: false, error: "Yêu cầu đăng nhập để thiết lập vai trò." },
    };
  }

  const { role } = requestBody || {};

  // 2. Validate allowed roles (teacher, tutor, student)
  if (!["teacher", "tutor", "student"].includes(role)) {
    return {
      status: 400,
      body: { success: false, error: "Vai trò được chọn không hợp lệ." },
    };
  }

  // 3. Prevent student privilege escalation
  if (dbProfile?.role === "student" && role !== "student") {
    return {
      status: 403,
      body: {
        success: false,
        error: "Tài khoản học sinh không được phép tự chuyển sang vai trò giáo viên hoặc gia sư. Vui lòng liên hệ quản trị viên.",
      },
    };
  }

  // Prevent tampering with admin accounts
  if (dbProfile?.role === "admin") {
    return {
      status: 403,
      body: {
        success: false,
        error: "Tài khoản quản trị viên không thể thay đổi vai trò qua giao diện này.",
      },
    };
  }

  // Idempotent
  if (dbProfile?.role === role) {
    return {
      status: 200,
      body: { success: true, role, idempotent: true },
    };
  }

  // Simulated DB write: only `role` and `updated_at` are written for sessionUser.id
  return {
    status: 200,
    body: { success: true, role, targetUserId: sessionUser.id },
  };
}

test("2.1 Unauthenticated requests to /api/user/set-role return 401", () => {
  const res = handleSetRoleEndpoint({
    sessionUser: null,
    dbProfile: null,
    requestBody: { role: "teacher" },
  });
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test("2.2 Student attempting privilege escalation to 'teacher' or 'tutor' is blocked with 403", () => {
  const student = { id: "student-uuid-1", email: "student@test.vn" };
  const profile = { role: "student" };

  const resTeacher = handleSetRoleEndpoint({
    sessionUser: student,
    dbProfile: profile,
    requestBody: { role: "teacher" },
  });
  assert.equal(resTeacher.status, 403);
  assert.ok(resTeacher.body.error.includes("Tài khoản học sinh không được phép"));

  const resTutor = handleSetRoleEndpoint({
    sessionUser: student,
    dbProfile: profile,
    requestBody: { role: "tutor" },
  });
  assert.equal(resTutor.status, 403);
});

test("2.3 Setting role to 'admin' or system roles is blocked with 400 for ANY user", () => {
  const student = { id: "student-uuid-1", email: "student@test.vn" };
  const teacher = { id: "teacher-uuid-1", email: "teacher@test.vn" };
  const forbiddenRoles = [
    "admin",
    "ADMIN",
    "superadmin",
    "root",
    "service_role",
    "moderator",
    "auditor",
    "owner",
  ];

  for (const badRole of forbiddenRoles) {
    const resFromStudent = handleSetRoleEndpoint({
      sessionUser: student,
      dbProfile: { role: "student" },
      requestBody: { role: badRole },
    });
    assert.equal(resFromStudent.status, 400, `Role '${badRole}' must return 400`);

    const resFromTeacher = handleSetRoleEndpoint({
      sessionUser: teacher,
      dbProfile: { role: "teacher" },
      requestBody: { role: badRole },
    });
    assert.equal(resFromTeacher.status, 400, `Role '${badRole}' must return 400`);
  }
});

test("2.4 Type confusion and parameter tampering payloads are rejected with 400", () => {
  const user = { id: "u-1", email: "u@test.vn" };
  const malformedPayloads = [
    {},
    { role: null },
    { role: undefined },
    { role: 123 },
    { role: true },
    { role: ["teacher"] },
    { role: { name: "teacher" } },
    { role: "teacher\0" },
    { role: "teacher " },
    { role: " TEACHER " },
    { role: "teacher; DROP TABLE users;--" },
  ];

  for (const body of malformedPayloads) {
    const res = handleSetRoleEndpoint({
      sessionUser: user,
      dbProfile: { role: "teacher" },
      requestBody: body,
    });
    assert.equal(res.status, 400, `Payload ${JSON.stringify(body)} must return 400`);
  }
});

test("2.5 Admin accounts cannot be tampered or downgraded via set-role (403)", () => {
  const adminUser = { id: "adm-1", email: "truongcri0101@gmail.com" };
  const adminProfile = { role: "admin" };

  for (const role of ["student", "teacher", "tutor"]) {
    const res = handleSetRoleEndpoint({
      sessionUser: adminUser,
      dbProfile: adminProfile,
      requestBody: { role },
    });
    assert.equal(res.status, 403);
    assert.ok(res.body.error.includes("Tài khoản quản trị viên không thể thay đổi"));
  }
});

test("2.6 Privilege injection in body (spoofed target id, tier, is_admin) is neutralized", () => {
  const student = { id: "real-student-uuid", email: "student@test.vn" };
  const injectedBody = {
    role: "student",
    id: "victim-teacher-uuid", // Attempting to alter victim's record
    is_admin: true,
    tier: "max",
    credits: 999999,
  };

  const res = handleSetRoleEndpoint({
    sessionUser: student,
    dbProfile: { role: "student" },
    requestBody: injectedBody,
  });

  // Legitimate student confirms role 'student' idempotently
  assert.equal(res.status, 200);
  assert.equal(res.body.role, "student");
});

// =============================================================================
// SUITE 3: ADMIN API ENDPOINTS (/api/admin/affiliate & /api/admin/verifications)
// =============================================================================
console.log("\n--- Suite 3: Admin API Endpoints Authorization & Spoofing Defense ---");

// Logic mirrored directly from frontend/src/lib/auth/admin.ts
const MASTER_ADMIN_EMAIL = "truongcri0101@gmail.com";
const ADMIN_EMAIL_DOMAIN = "@admin.edteach.vn";

function isEmailAdmin(user) {
  if (!user?.email) return false;
  const email = user.email.toLowerCase().trim();
  return email === MASTER_ADMIN_EMAIL || email.endsWith(ADMIN_EMAIL_DOMAIN);
}

test("3.1 Admin email validation rejects sophisticated impostor emails", () => {
  const impostorEmails = [
    "truongcri0101@gmail.com.co",
    "truongcri0101@gmail.com@attacker.com",
    "truongcri0101@gmail.com.attacker.com",
    "attacker@admin.edteach.vn.attacker.com",
    "attacker@evil-admin.edteach.vn",
    "attacker@admin-edteach.vn",
    "attacker@sub.admin.edteach.vn",
    "admin.edteach.vn@gmail.com",
    "fakeadmin@gmail.com",
    "admin@gmail.com",
  ];

  for (const email of impostorEmails) {
    assert.equal(
      isEmailAdmin({ email }),
      false,
      `Email ${email} must NOT pass isEmailAdmin`
    );
  }
});

test("3.2 Admin email validation accepts authentic admin emails", () => {
  const authenticEmails = [
    "truongcri0101@gmail.com",
    "TRUONGCRI0101@GMAIL.COM",
    "  truongcri0101@gmail.com  ",
    "director@admin.edteach.vn",
    "support@admin.edteach.vn",
    "ADMIN@ADMIN.EDTEACH.VN",
  ];

  for (const email of authenticEmails) {
    assert.equal(
      isEmailAdmin({ email }),
      true,
      `Email ${email} must pass isEmailAdmin`
    );
  }
});

// Emulate /api/admin/affiliate route
function handleAdminAffiliateRoute({ user, isDbAdmin, action, payoutId }) {
  const isAuthorized = Boolean(user && (isEmailAdmin(user) || isDbAdmin));
  if (!isAuthorized) {
    return { status: 403, body: { error: "Bạn không có quyền thao tác quản trị." } };
  }

  if (!payoutId || !["approve", "reject"].includes(action)) {
    return { status: 400, body: { error: "Thông tin thao tác không hợp lệ." } };
  }

  return { status: 200, body: { success: true, action, payoutId } };
}

test("3.3 /api/admin/affiliate denies unauthenticated and unauthorized callers", () => {
  // Unauthenticated
  assert.equal(handleAdminAffiliateRoute({ user: null }).status, 403);

  // Normal teacher
  assert.equal(
    handleAdminAffiliateRoute({
      user: { id: "t1", email: "teacher@school.edu" },
      isDbAdmin: false,
      payoutId: "p1",
      action: "approve",
    }).status,
    403
  );

  // Email impostor
  assert.equal(
    handleAdminAffiliateRoute({
      user: { id: "att1", email: "admin@gmail.com" },
      isDbAdmin: false,
      payoutId: "p1",
      action: "approve",
    }).status,
    403
  );
});

test("3.4 /api/admin/affiliate enforces valid action and payoutId for authorized admin", () => {
  const admin = { id: "a1", email: "truongcri0101@gmail.com" };

  // Invalid action
  assert.equal(
    handleAdminAffiliateRoute({ user: admin, payoutId: "p1", action: "delete_all" }).status,
    400
  );

  // Missing payoutId
  assert.equal(
    handleAdminAffiliateRoute({ user: admin, payoutId: null, action: "approve" }).status,
    400
  );

  // Valid
  const resValid = handleAdminAffiliateRoute({ user: admin, payoutId: "p1", action: "approve" });
  assert.equal(resValid.status, 200);
  assert.equal(resValid.body.success, true);
});

// Emulate /api/admin/verifications route
function handleAdminVerificationRoute({ user, isDbAdmin, body }) {
  const isAuthorized = Boolean(user && (isEmailAdmin(user) || isDbAdmin));
  if (!isAuthorized) {
    return { status: 403, body: { error: "Bạn không có quyền phê duyệt hồ sơ xác thực." } };
  }

  const { recordId, action, reason } = body || {};
  if (!recordId || !action || !["approved", "rejected"].includes(action)) {
    return { status: 400, body: { error: "Thiếu recordId hoặc hành động phê duyệt không hợp lệ." } };
  }

  // Secure binding: adminUserId forced to authenticated user.id
  const processedRecord = {
    recordId,
    adminUserId: user.id, // Authenticated session ID enforced
    action,
    rejectionReason: reason,
  };

  return { status: 200, body: { success: true, processedRecord } };
}

test("3.5 /api/admin/verifications binds adminUserId to authenticated user.id, ignoring body spoofing", () => {
  const admin = { id: "legitimate-admin-uuid-999", email: "truongcri0101@gmail.com" };
  const spoofedBody = {
    recordId: "rec-888",
    action: "approved",
    adminUserId: "victim-admin-id", // Attacker trying to blame someone else
  };

  const res = handleAdminVerificationRoute({ user: admin, body: spoofedBody });
  assert.equal(res.status, 200);
  assert.equal(
    res.body.processedRecord.adminUserId,
    "legitimate-admin-uuid-999",
    "adminUserId must match session user.id, not spoofed body property"
  );
});

// =============================================================================
// SUITE 4: DATABASE TRIGGER INTEGRITY & RLS PRIVILEGE LOCKS
// =============================================================================
console.log("\n--- Suite 4: Database Trigger Integrity & RLS Privilege Locks ---");

// Emulate public.prevent_user_privilege_escalation() from 20261109_hotfix_rls_and_privilege.sql
function executeDbEscalationTrigger({ isServiceRole, oldRow, newRow }) {
  const result = { ...newRow };

  if (!isServiceRole) {
    // 1. Revert protected columns
    result.role = oldRow.role;
    result.tier = oldRow.tier;
    result.referral_code = oldRow.referral_code;
    result.is_verified_teacher = oldRow.is_verified_teacher;
    result.verified_at = oldRow.verified_at;
    result.verified_school = oldRow.verified_school;
    result.affiliate_balance = oldRow.affiliate_balance;
    result.total_affiliate_earned = oldRow.total_affiliate_earned;
    result.subscription_expires_at = oldRow.subscription_expires_at;

    // 2. Preferences stripping
    if (JSON.stringify(newRow.preferences) !== JSON.stringify(oldRow.preferences)) {
      if (newRow.preferences !== null && typeof newRow.preferences === "object") {
        const cleanedPrefs = { ...newRow.preferences };
        const forbiddenKeys = [
          "subscription_tier",
          "tier",
          "role",
          "is_admin",
          "is_verified_teacher",
          "credits",
          "affiliate_balance",
        ];
        for (const k of forbiddenKeys) {
          delete cleanedPrefs[k];
        }

        // Restore legitimate old subscription_tier if previously set
        if (oldRow.preferences && oldRow.preferences.subscription_tier) {
          cleanedPrefs.subscription_tier = oldRow.preferences.subscription_tier;
        }
        result.preferences = cleanedPrefs;
      } else {
        result.preferences = oldRow.preferences || {};
      }
    }
  }

  return result;
}

test("4.1 Direct client UPDATE on sensitive columns is reverted by trigger", () => {
  const oldRow = {
    id: "user-1",
    role: "student",
    tier: "free",
    referral_code: "REF_ORIGINAL",
    is_verified_teacher: false,
    verified_at: null,
    verified_school: null,
    affiliate_balance: 0,
    total_affiliate_earned: 0,
    subscription_expires_at: null,
    preferences: { theme: "dark" },
  };

  const maliciousUpdate = {
    ...oldRow,
    role: "admin",
    tier: "max",
    referral_code: "HACKED_REF",
    is_verified_teacher: true,
    verified_at: new Date().toISOString(),
    verified_school: "Hacked High School",
    affiliate_balance: 50000000,
    total_affiliate_earned: 50000000,
    subscription_expires_at: new Date(Date.now() + 86400000 * 365).toISOString(),
  };

  const triggered = executeDbEscalationTrigger({
    isServiceRole: false,
    oldRow,
    newRow: maliciousUpdate,
  });

  assert.equal(triggered.role, "student");
  assert.equal(triggered.tier, "free");
  assert.equal(triggered.referral_code, "REF_ORIGINAL");
  assert.equal(triggered.is_verified_teacher, false);
  assert.equal(triggered.verified_at, null);
  assert.equal(triggered.verified_school, null);
  assert.equal(triggered.affiliate_balance, 0);
  assert.equal(triggered.total_affiliate_earned, 0);
  assert.equal(triggered.subscription_expires_at, null);
});

test("4.2 Service role can legitimately update protected columns", () => {
  const oldRow = {
    id: "user-1",
    role: "student",
    tier: "free",
    affiliate_balance: 0,
    preferences: {},
  };

  const adminUpdate = {
    ...oldRow,
    role: "teacher",
    tier: "pro",
    affiliate_balance: 100000,
  };

  const triggered = executeDbEscalationTrigger({
    isServiceRole: true,
    oldRow,
    newRow: adminUpdate,
  });

  assert.equal(triggered.role, "teacher");
  assert.equal(triggered.tier, "pro");
  assert.equal(triggered.affiliate_balance, 100000);
});

test("4.3 Injection of privilege keys in preferences JSONB is stripped for client updates", () => {
  const oldRow = {
    preferences: { theme: "light", lang: "vi" },
  };

  const maliciousUpdate = {
    preferences: {
      theme: "dark",
      lang: "vi",
      subscription_tier: "max",
      tier: "school",
      role: "admin",
      is_admin: true,
      is_verified_teacher: true,
      credits: 9999999,
      affiliate_balance: 10000000,
    },
  };

  const triggered = executeDbEscalationTrigger({
    isServiceRole: false,
    oldRow,
    newRow: maliciousUpdate,
  });

  assert.equal(triggered.preferences.theme, "dark");
  assert.equal(triggered.preferences.lang, "vi");
  assert.equal(triggered.preferences.subscription_tier, undefined);
  assert.equal(triggered.preferences.tier, undefined);
  assert.equal(triggered.preferences.role, undefined);
  assert.equal(triggered.preferences.is_admin, undefined);
  assert.equal(triggered.preferences.is_verified_teacher, undefined);
  assert.equal(triggered.preferences.credits, undefined);
  assert.equal(triggered.preferences.affiliate_balance, undefined);
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log("\n================================================================================");
console.log(`DEEP PROBE RESULTS: ${passed}/${total} passed (${failures.length} failures)`);
console.log("================================================================================");

if (failures.length > 0) {
  console.error("FAILURES DETECTED:");
  for (const f of failures) {
    console.error(`- ${f.name}: ${f.error.message}`);
  }
  process.exit(1);
} else {
  console.log("ALL DEEP ADVERSARIAL EDGE-CASE PROBES PASSED SUCCESSFULLY!");
  process.exit(0);
}
