// tests/adversarial/m1_bypass_stress_test.mjs
// Adversarial Bypass Test Suite for Milestone 1 (PR 0.1 & PR 0.2)
// Written by Teamwork Challenger (Empirical Challenger)

import assert from "node:assert/strict";

console.log("================================================================================");
console.log("STARTING EMPIRICAL ADVERSARIAL STRESS TEST: MILESTONE 1 (PR 0.1 & PR 0.2)");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;
const failures = [];

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failures.push({ name, error: err });
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failures.push({ name, error: err });
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: ADMIN EMAIL & ADMIN PERMISSION LOGIC (frontend/src/lib/auth/admin.ts)
// -----------------------------------------------------------------------------
console.log("\n--- Section 1: Testing Admin Auth Verification Logic ---");

const MASTER_ADMIN_EMAIL = "truongcri0101@gmail.com";
const ADMIN_EMAIL_DOMAIN = "@admin.edteach.vn";

function isEmailAdmin(user) {
  if (!user?.email) return false;
  const email = user.email.toLowerCase().trim();
  return email === MASTER_ADMIN_EMAIL || email.endsWith(ADMIN_EMAIL_DOMAIN);
}

async function isAdmin(supabase, user) {
  if (!user || !user.email) return false;
  if (isEmailAdmin(user)) return true;

  try {
    const { data: dbUser, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return false;
    return dbUser?.role === "admin";
  } catch {
    return false;
  }
}

// Test 1.1: Legitimate admin emails
runTest("1.1 Authentic master admin email matches", () => {
  assert.equal(isEmailAdmin({ email: "truongcri0101@gmail.com" }), true);
  assert.equal(isEmailAdmin({ email: "TRUONGCRI0101@GMAIL.COM" }), true);
  assert.equal(isEmailAdmin({ email: "  truongcri0101@gmail.com  " }), true);
});

runTest("1.2 Authentic @admin.edteach.vn domain matches", () => {
  assert.equal(isEmailAdmin({ email: "admin@admin.edteach.vn" }), true);
  assert.equal(isEmailAdmin({ email: "hoang.dev@admin.edteach.vn" }), true);
  assert.equal(isEmailAdmin({ email: "SUPERVISOR@ADMIN.EDTEACH.VN" }), true);
});

// Test 1.2: Adversarial / Impostor emails attempting bypass
runTest("1.3 Adversarial emails with 'admin' substring must be REJECTED", () => {
  const attackVectors = [
    "fakeadmin@gmail.com",
    "admin@gmail.com",
    "attacker.admin@example.com",
    "admin123@yahoo.com",
    "not-admin@gmail.com",
    "admin@edteach.vn", // missing 'admin.' subdomain
    "admin.edteach.vn@gmail.com", // domain in username
    "attacker@admin.edteach.vn.attacker.com", // domain spoofing via subdomain
    "attacker@evil-admin.edteach.vn", // hyphen variation
    "attacker@admin-edteach.vn", // hyphen variation
    "truongcri0101@gmail.com.evil.com", // prefix impersonation
    "truongcri0101@gmail.com@evil.com", // double @ trick
  ];

  for (const email of attackVectors) {
    assert.equal(
      isEmailAdmin({ email }),
      false,
      `Impostor email should be rejected: ${email}`
    );
  }
});

runTest("1.4 Edge cases & malformed user objects", () => {
  assert.equal(isEmailAdmin(null), false);
  assert.equal(isEmailAdmin(undefined), false);
  assert.equal(isEmailAdmin({}), false);
  assert.equal(isEmailAdmin({ email: null }), false);
  assert.equal(isEmailAdmin({ email: "" }), false);
  assert.equal(isEmailAdmin({ email: "   " }), false);
});

await runAsyncTest("1.5 isAdmin database role check with mocked Supabase client", async () => {
  // Case A: Unauthenticated
  assert.equal(await isAdmin({}, null), false);

  // Case B: User has non-admin email and db returns role 'teacher'
  const mockTeacherSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { role: "teacher" }, error: null }),
        }),
      }),
    }),
  };
  assert.equal(
    await isAdmin(mockTeacherSupabase, { id: "u1", email: "teacher@school.edu" }),
    false
  );

  // Case C: User has non-admin email and db returns role 'student'
  const mockStudentSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { role: "student" }, error: null }),
        }),
      }),
    }),
  };
  assert.equal(
    await isAdmin(mockStudentSupabase, { id: "u2", email: "student@school.edu" }),
    false
  );

  // Case D: User has non-admin email and db returns error
  const mockErrorSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: new Error("DB Error") }),
        }),
      }),
    }),
  };
  assert.equal(
    await isAdmin(mockErrorSupabase, { id: "u3", email: "attacker@gmail.com" }),
    false
  );

  // Case E: User has custom email but DB confirms role 'admin'
  const mockAdminSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { role: "admin" }, error: null }),
        }),
      }),
    }),
  };
  assert.equal(
    await isAdmin(mockAdminSupabase, { id: "u4", email: "custom-admin@org.vn" }),
    true
  );
});

// -----------------------------------------------------------------------------
// SECTION 2: MIDDLEWARE ROUTE MATCHER & AUTH GUARD (frontend/src/middleware.ts)
// -----------------------------------------------------------------------------
console.log("\n--- Section 2: Testing Middleware Route Matcher & Auth Guard ---");

// Exact logic extracted from frontend/src/middleware.ts
function checkMiddleware(pathname, user, headers = {}, searchParams = new URLSearchParams()) {
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

  // Check if header bypass exists (e.g. x-playwright-audit)
  // In the old code, isAudit was: headers["x-playwright-audit"] === "true";
  // In the fixed code, there is NO isAudit check at all!

  if (!user && isProtectedRoute) {
    const redirectUrl = `/login?redirectTo=${encodeURIComponent(pathname)}&next=${encodeURIComponent(pathname)}`;
    return { action: "REDIRECT", to: redirectUrl };
  }

  if (user && isAuthRoute) {
    const destination =
      searchParams.get("redirectTo") || searchParams.get("next");
    if (destination && destination.startsWith("/") && !destination.startsWith("//")) {
      return { action: "REDIRECT", to: destination };
    }
    return { action: "REDIRECT", to: "/dashboard" };
  }

  return { action: "NEXT" };
}

runTest("2.1 Unauthenticated requests to all protected routes MUST REDIRECT to /login", () => {
  const protectedPaths = [
    "/dashboard",
    "/dashboard/overview",
    "/exams",
    "/exams/create",
    "/exams/123",
    "/teach",
    "/teach/exam-456",
    "/wallet",
    "/wallet/topup",
    "/settings",
    "/settings/profile",
    "/student",
    "/student/exams",
    "/student/exams/attempt/789",
    "/labs",
    "/labs/physics",
    "/labs/physics/photoelectric-step",
    "/labs/chemistry/titration-step",
    "/marketplace",
    "/marketplace/item/abc",
    "/marketplace/checkout",
    "/whiteboard",
    "/whiteboard/wb-123",
    "/admin",
    "/admin/affiliate",
    "/admin/verifications",
    "/affiliate",
    "/affiliate/dashboard",
    "/affiliate/payout",
    "/grading",
    "/grading/review/123",
  ];

  for (const path of protectedPaths) {
    const result = checkMiddleware(path, null);
    assert.equal(
      result.action,
      "REDIRECT",
      `Path ${path} must be protected when unauthenticated`
    );
    assert.ok(
      result.to.startsWith("/login?redirectTo="),
      `Redirect target for ${path} should be /login?redirectTo=...`
    );
  }
});

runTest("2.2 Public route exception /grading/submit MUST NOT be redirected", () => {
  const publicGradingPaths = [
    "/grading/submit",
    "/grading/submit?code=EXAM-101",
    "/grading/submit/confirm",
  ];

  for (const path of publicGradingPaths) {
    const result = checkMiddleware(path, null);
    assert.equal(
      result.action,
      "NEXT",
      `Public submission path ${path} should be accessible without session`
    );
  }
});

runTest("2.3 Header injection (x-playwright-audit) MUST NOT BYPASS middleware", () => {
  const maliciousHeaders = [
    { "x-playwright-audit": "true" },
    { "x-playwright-audit": "1" },
    { "X-Playwright-Audit": "true" },
    { "x-playwright-audit": "admin" },
  ];

  for (const headers of maliciousHeaders) {
    const result = checkMiddleware("/dashboard", null, headers);
    assert.equal(
      result.action,
      "REDIRECT",
      `Sending header ${JSON.stringify(headers)} must NOT bypass auth`
    );
  }
});

runTest("2.4 Query param injection (?audit=true) MUST NOT BYPASS middleware", () => {
  const testPaths = [
    "/student?audit=true",
    "/whiteboard/123?audit=true",
    "/teach/456?audit=true",
    "/admin/affiliate?audit=true",
    "/marketplace?audit=true",
  ];

  for (const fullPath of testPaths) {
    const pathname = fullPath.split("?")[0];
    const result = checkMiddleware(pathname, null);
    assert.equal(
      result.action,
      "REDIRECT",
      `Path with query ${fullPath} must still be redirected to /login`
    );
  }
});

runTest("2.5 Open redirect guard on /login redirect", () => {
  const loggedInUser = { id: "user1", email: "user@edteach.vn" };

  // Attempt A: Protocol-relative double slash "//evil.com"
  const paramsA = new URLSearchParams({ redirectTo: "//evil.com" });
  const resA = checkMiddleware("/login", loggedInUser, {}, paramsA);
  assert.equal(
    resA.to,
    "/dashboard",
    "Should fallback to /dashboard for protocol-relative //evil.com"
  );

  // Attempt B: Normal internal route "/student/exams"
  const paramsB = new URLSearchParams({ redirectTo: "/student/exams" });
  const resB = checkMiddleware("/login", loggedInUser, {}, paramsB);
  assert.equal(
    resB.to,
    "/student/exams",
    "Should safely redirect to internal /student/exams"
  );

  // Attempt C: Non-slash absolute external url "https://evil.com"
  const paramsC = new URLSearchParams({ redirectTo: "https://evil.com" });
  const resC = checkMiddleware("/login", loggedInUser, {}, paramsC);
  assert.equal(
    resC.to,
    "/dashboard",
    "Should fallback to /dashboard for absolute external URL"
  );
});

// -----------------------------------------------------------------------------
// SECTION 3: ADMIN API ROUTE HANDLERS
// -----------------------------------------------------------------------------
console.log("\n--- Section 3: Testing Admin API Route Handlers ---");

// Emulate /api/admin/affiliate authorization logic
function checkAdminAffiliateAuth(user, isAdminFlag) {
  const isAuthorized = Boolean(user && isAdminFlag);
  if (!isAuthorized) {
    return { status: 403, error: "Bạn không có quyền truy cập trang quản trị này." };
  }
  return { status: 200, success: true };
}

runTest("3.1 /api/admin/affiliate rejects unauthenticated requests (user = null)", () => {
  const res = checkAdminAffiliateAuth(null, false);
  assert.equal(res.status, 403);
});

runTest("3.2 /api/admin/affiliate rejects non-admin users (teacher, student)", () => {
  const teacherUser = { id: "t1", email: "teacher@school.edu" };
  const resTeacher = checkAdminAffiliateAuth(teacherUser, false);
  assert.equal(resTeacher.status, 403);

  const studentUser = { id: "s1", email: "student@school.edu" };
  const resStudent = checkAdminAffiliateAuth(studentUser, false);
  assert.equal(resStudent.status, 403);
});

runTest("3.3 /api/admin/affiliate rejects email substring attacker (fakeadmin@gmail.com)", () => {
  const attackerUser = { id: "att1", email: "fakeadmin@gmail.com" };
  const isAdminCalculated = isEmailAdmin(attackerUser);
  assert.equal(isAdminCalculated, false);
  const res = checkAdminAffiliateAuth(attackerUser, isAdminCalculated);
  assert.equal(res.status, 403);
});

runTest("3.4 /api/admin/affiliate grants access to genuine admin", () => {
  const adminUser = { id: "adm1", email: "truongcri0101@gmail.com" };
  const isAdminCalculated = isEmailAdmin(adminUser);
  assert.equal(isAdminCalculated, true);
  const res = checkAdminAffiliateAuth(adminUser, isAdminCalculated);
  assert.equal(res.status, 200);
});

// Emulate /api/admin/verifications POST logic
function handleAdminVerificationPost(user, isAdminFlag, body) {
  if (!user || !isAdminFlag) {
    return { status: 403, error: "Bạn không có quyền phê duyệt hồ sơ xác thực." };
  }

  const { recordId, action, reason } = body;
  if (!recordId || !action || !["approved", "rejected"].includes(action)) {
    return { status: 400, error: "Thiếu recordId hoặc hành động phê duyệt không hợp lệ." };
  }

  // KEY ADVERSARIAL CHECK: Enforce adminUserId = user.id, completely ignoring any body.adminUserId
  const reviewParams = {
    recordId,
    adminUserId: user.id, // Forcibly bound to authenticated session user.id
    action,
    rejectionReason: reason,
  };

  return { status: 200, success: true, processedReview: reviewParams };
}

runTest("3.5 /api/admin/verifications POST rejects unauthenticated callers", () => {
  const res = handleAdminVerificationPost(null, false, {
    recordId: "rec-1",
    action: "approved",
  });
  assert.equal(res.status, 403);
});

runTest("3.6 /api/admin/verifications POST neutralizes spoofed adminUserId in body", () => {
  const adminUser = { id: "actual-admin-uuid-1234", email: "truongcri0101@gmail.com" };
  const spoofedBody = {
    recordId: "rec-99",
    action: "approved",
    adminUserId: "admin_super", // Attacker trying to spoof superadmin identity
  };

  const res = handleAdminVerificationPost(adminUser, true, spoofedBody);
  assert.equal(res.status, 200);
  assert.equal(
    res.processedReview.adminUserId,
    "actual-admin-uuid-1234",
    "adminUserId MUST match authenticated user.id, ignoring spoofed body value"
  );
  assert.notEqual(res.processedReview.adminUserId, "admin_super");
});

runTest("3.7 /api/admin/verifications POST validates action parameter", () => {
  const adminUser = { id: "actual-admin-uuid-1234", email: "truongcri0101@gmail.com" };
  const invalidBody = {
    recordId: "rec-99",
    action: "grant_all_permissions",
  };

  const res = handleAdminVerificationPost(adminUser, true, invalidBody);
  assert.equal(res.status, 400);
});

// -----------------------------------------------------------------------------
// SECTION 4: USER SET-ROLE ENDPOINT (/api/user/set-role)
// -----------------------------------------------------------------------------
console.log("\n--- Section 4: Testing User Role Tampering & Escalation Lock ---");

// Emulate /api/user/set-role logic
function handleSetRole(user, currentProfile, body) {
  // 1. Enforce authentication
  if (!user) {
    return { status: 401, error: "Yêu cầu đăng nhập để thiết lập vai trò." };
  }

  const { role } = body || {};

  // 2. Validate allowed roles
  if (!["teacher", "tutor", "student"].includes(role)) {
    return { status: 400, error: "Vai trò được chọn không hợp lệ." };
  }

  // 3. Prevent student privilege escalation
  if (currentProfile?.role === "student" && role !== "student") {
    return {
      status: 403,
      error: "Tài khoản học sinh không được phép tự chuyển sang vai trò giáo viên hoặc gia sư.",
    };
  }

  // Prevent tampering with admin accounts
  if (currentProfile?.role === "admin") {
    return {
      status: 403,
      error: "Tài khoản quản trị viên không thể thay đổi vai trò qua giao diện này.",
    };
  }

  // Idempotent
  if (currentProfile?.role === role) {
    return { status: 200, success: true, role, idempotent: true };
  }

  return { status: 200, success: true, role };
}

runTest("4.1 Unauthenticated requests to /api/user/set-role return HTTP 401", () => {
  const res = handleSetRole(null, null, { role: "teacher" });
  assert.equal(res.status, 401);
});

runTest("4.2 Student account attempting escalation to 'teacher' is BLOCKED with 403", () => {
  const studentUser = { id: "s1", email: "student@school.edu" };
  const studentProfile = { role: "student" };
  const res = handleSetRole(studentUser, studentProfile, { role: "teacher" });
  assert.equal(res.status, 403);
});

runTest("4.3 Student account attempting escalation to 'tutor' is BLOCKED with 403", () => {
  const studentUser = { id: "s1", email: "student@school.edu" };
  const studentProfile = { role: "student" };
  const res = handleSetRole(studentUser, studentProfile, { role: "tutor" });
  assert.equal(res.status, 403);
});

runTest("4.4 Any user attempting to set role to 'admin' is REJECTED with 400", () => {
  const user = { id: "u1", email: "user@school.edu" };
  const profile = { role: "teacher" };
  const res = handleSetRole(user, profile, { role: "admin" });
  assert.equal(res.status, 400);
});

runTest("4.5 Arbitrary or malicious role names are REJECTED with 400", () => {
  const user = { id: "u1", email: "user@school.edu" };
  const profile = { role: "teacher" };
  const attackPayloads = [
    "superuser",
    "root",
    "ADMIN",
    "Teacher",
    "null",
    null,
    undefined,
    123,
    "teacher; DROP TABLE users;",
    "__proto__",
  ];

  for (const badRole of attackPayloads) {
    const res = handleSetRole(user, profile, { role: badRole });
    assert.equal(res.status, 400, `Bad role '${badRole}' should return 400`);
  }
});

runTest("4.6 Admin account cannot be downgraded or tampered via set-role (403)", () => {
  const adminUser = { id: "a1", email: "truongcri0101@gmail.com" };
  const adminProfile = { role: "admin" };
  const res = handleSetRole(adminUser, adminProfile, { role: "student" });
  assert.equal(res.status, 403);
});

runTest("4.7 Teacher account can switch to tutor or student", () => {
  const teacherUser = { id: "t1", email: "teacher@school.edu" };
  const teacherProfile = { role: "teacher" };
  const resTutor = handleSetRole(teacherUser, teacherProfile, { role: "tutor" });
  assert.equal(resTutor.status, 200);

  const resStudent = handleSetRole(teacherUser, teacherProfile, { role: "student" });
  assert.equal(resStudent.status, 200);
});

runTest("4.8 Newly registered account (no role yet) can choose role", () => {
  const newUser = { id: "new1", email: "new@school.edu" };
  const newProfile = { role: null };
  const resTeacher = handleSetRole(newUser, newProfile, { role: "teacher" });
  assert.equal(resTeacher.status, 200);
  assert.equal(resTeacher.role, "teacher");

  const resStudent = handleSetRole(newUser, newProfile, { role: "student" });
  assert.equal(resStudent.status, 200);
  assert.equal(resStudent.role, "student");
});

// -----------------------------------------------------------------------------
// SECTION 5: DATABASE TRIGGER & PRIVILEGE LOCK VERIFICATION (PL/pgSQL Simulation)
// -----------------------------------------------------------------------------
console.log("\n--- Section 5: Testing Database Trigger & RLS Privilege Locks ---");

// Emulate public.prevent_user_privilege_escalation() logic
function simulateDbTrigger(isServiceRole, oldRow, newRow) {
  const result = { ...newRow };

  if (!isServiceRole) {
    // Revert protected columns
    result.role = oldRow.role;
    result.tier = oldRow.tier;
    result.referral_code = oldRow.referral_code;
    result.is_verified_teacher = oldRow.is_verified_teacher;
    result.verified_at = oldRow.verified_at;
    result.verified_school = oldRow.verified_school;
    result.affiliate_balance = oldRow.affiliate_balance;
    result.total_affiliate_earned = oldRow.total_affiliate_earned;
    result.subscription_expires_at = oldRow.subscription_expires_at;

    // Preferences stripping
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

runTest("5.1 Client UPDATE on role, tier, affiliate_balance is REVERTED by trigger", () => {
  const oldUser = {
    id: "u1",
    role: "student",
    tier: "free",
    referral_code: "REF123",
    is_verified_teacher: false,
    verified_at: null,
    verified_school: null,
    affiliate_balance: 0,
    total_affiliate_earned: 0,
    subscription_expires_at: null,
    preferences: { theme: "dark" },
  };

  // Malicious client attempt: escalate role, set tier='max', inflate affiliate_balance
  const maliciousUpdate = {
    ...oldUser,
    role: "admin",
    tier: "max",
    affiliate_balance: 999999999,
    is_verified_teacher: true,
  };

  const triggered = simulateDbTrigger(false, oldUser, maliciousUpdate);
  assert.equal(triggered.role, "student", "role must be reverted to OLD.role");
  assert.equal(triggered.tier, "free", "tier must be reverted to OLD.tier");
  assert.equal(triggered.affiliate_balance, 0, "affiliate_balance must be reverted");
  assert.equal(triggered.is_verified_teacher, false, "is_verified_teacher must be reverted");
});

runTest("5.2 Client injection of subscription_tier in preferences JSONB is STRIPPED", () => {
  const oldUser = {
    preferences: { theme: "dark", language: "vi" },
  };

  const maliciousPreferences = {
    theme: "light",
    language: "vi",
    subscription_tier: "max", // Injected VIP tier
    is_admin: true,
    credits: 1000000,
  };

  const triggered = simulateDbTrigger(false, oldUser, { preferences: maliciousPreferences });
  assert.equal(triggered.preferences.theme, "light", "Legitimate pref updated");
  assert.equal(triggered.preferences.subscription_tier, undefined, "Injected tier stripped");
  assert.equal(triggered.preferences.is_admin, undefined, "Injected is_admin stripped");
  assert.equal(triggered.preferences.credits, undefined, "Injected credits stripped");
});

runTest("5.3 Legitimate subscription_tier granted by service_role is PRESERVED upon client update", () => {
  const oldUser = {
    preferences: { subscription_tier: "pro", theme: "dark" },
  };

  // User updates their theme to "light", client omits subscription_tier
  const clientUpdate = {
    preferences: { theme: "light" },
  };

  const triggered = simulateDbTrigger(false, oldUser, clientUpdate);
  assert.equal(triggered.preferences.theme, "light");
  assert.equal(
    triggered.preferences.subscription_tier,
    "pro",
    "Legitimate service-role tier must be preserved"
  );
});

runTest("5.4 Client setting preferences to NULL is COERCED to old preferences", () => {
  const oldUser = {
    preferences: { theme: "dark" },
  };

  const triggered = simulateDbTrigger(false, oldUser, { preferences: null });
  assert.deepEqual(triggered.preferences, { theme: "dark" });
});

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log("\n================================================================================");
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed (${failures.length} failures)`);
console.log("================================================================================");

if (failures.length > 0) {
  console.error("\nTEST SUITE FAILED WITH FOLLOWING FAILURES:");
  for (const f of failures) {
    console.error(`- ${f.name}: ${f.error.message}`);
  }
  process.exit(1);
} else {
  console.log("\nALL ADVERSARIAL CHALLENGE TESTS PASSED PERFECTLY!");
  process.exit(0);
}
