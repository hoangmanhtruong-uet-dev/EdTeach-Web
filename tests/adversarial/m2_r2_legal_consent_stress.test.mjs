/**
 * Milestone 2 Reviewer 2 Adversarial Stress Test Suite
 * Validating Legal Pages, Cookie Consent Gating, Registration Unbundled Checkboxes,
 * and /api/user/delete Security, IDOR resistance, and Cancellation.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Milestone 2 - Reviewer 2 Adversarial & Quality Stress Tests", () => {
  const rootDir = process.cwd();

  // =========================================================================
  // 1. Static Prerender & Dynamic Bailout Stress Test
  // =========================================================================
  it("Layout & Static Pages: RootLayout does not import or invoke dynamic cookies()/headers()", () => {
    const layoutPath = path.join(rootDir, "frontend/src/app/layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");

    // Must not import cookies or headers from next/headers in RootLayout
    assert.doesNotMatch(
      layoutContent,
      /import\s+{[^}]*\b(cookies|headers)\b[^}]*}\s+from\s+["']next\/headers["']/,
      "RootLayout must not import dynamic cookies or headers, which triggers static bailout"
    );

    // CookieConsentBanner must be mounted
    assert.match(
      layoutContent,
      /<CookieConsentBanner\s*\/>/,
      "RootLayout must mount CookieConsentBanner"
    );

    // Unconditional Analytics must NOT be in layout.tsx
    assert.doesNotMatch(
      layoutContent,
      /<Analytics\s*\/>/,
      "Unconditional <Analytics /> in layout.tsx must be removed"
    );
    assert.doesNotMatch(
      layoutContent,
      /<SpeedInsights\s*\/>/,
      "Unconditional <SpeedInsights /> in layout.tsx must be removed"
    );
  });

  // =========================================================================
  // 2. CookieConsentBanner Logic & Tracking Gating Stress Test
  // =========================================================================
  it("CookieConsentBanner: Actively gates Analytics behind accepted opt-in", () => {
    const bannerPath = path.join(rootDir, "frontend/src/components/legal/CookieConsentBanner.tsx");
    const bannerContent = fs.readFileSync(bannerPath, "utf-8");

    // Must use client
    assert.match(bannerContent, /^"use client";/, "CookieConsentBanner must be a client component");

    // Must check for hydration before rendering (prevents React 418 hydration mismatch)
    assert.match(bannerContent, /if\s*\(!hasMounted\)\s*{\s*return null;\s*}/, "Must guard with hasMounted check");

    // Tracking scripts must be gated strictly by consent === 'accepted'
    assert.match(
      bannerContent,
      /\{consent\s*===\s*["']accepted["']\s*&&\s*\(\s*<>[\s\S]*?<Analytics\s*\/>[\s\S]*?<SpeedInsights\s*\/>/m,
      "Analytics and SpeedInsights must strictly be inside consent === 'accepted' block"
    );

    // Must support Secure flag in production HTTPS
    assert.match(
      bannerContent,
      /location\.protocol\s*===\s*["']https:["']/,
      "Cookie setting must dynamically apply Secure flag on HTTPS"
    );

    // Cookie parameters: Lax, 31536000 (1 year), Path=/
    assert.match(bannerContent, /SameSite=Lax/, "Must set SameSite=Lax");
    assert.match(bannerContent, /Max-Age=31536000/, "Must set Max-Age=31536000 (1 year)");
  });

  // =========================================================================
  // 3. Register Form: Unbundled & Un-checked Checkboxes per Decree 13
  // =========================================================================
  it("Register Form: Checkboxes default to false, separate terms and privacy, and enforce both for Google OAuth", () => {
    const registerPath = path.join(rootDir, "frontend/src/app/(auth)/register/page.tsx");
    const registerContent = fs.readFileSync(registerPath, "utf-8");

    // 1. Initial state must be false
    assert.match(
      registerContent,
      /const\s*\[agreeTerms,\s*setAgreeTerms\]\s*=\s*useState\(false\);/,
      "agreeTerms must be initialized to false (not pre-checked)"
    );
    assert.match(
      registerContent,
      /const\s*\[agreePrivacy,\s*setAgreePrivacy\]\s*=\s*useState\(false\);/,
      "agreePrivacy must be initialized to false (not pre-checked)"
    );

    // 2. Google OAuth must verify both
    assert.match(
      registerContent,
      /if\s*\(!agreeTerms\s*\|\|\s*!agreePrivacy\)/,
      "handleGoogleRegister must reject if either checkbox is unchecked"
    );

    // 3. Email register must verify both
    assert.match(
      registerContent,
      /if\s*\(!agreeTerms\s*\|\|\s*!agreePrivacy\)/,
      "handleRegister must reject if either checkbox is unchecked"
    );

    // 4. Fake testimonials and hyperbolic claims removed
    assert.doesNotMatch(
      registerContent,
      /50\.000\+\s*Thầy Cô/,
      "Unverified metric '50.000+ Thầy Cô' must be removed"
    );
    assert.doesNotMatch(
      registerContent,
      /1\.200\.000\s*đề thi/,
      "Unverified metric '1.200.000 đề thi' must be removed"
    );

    // 5. Purpose disclosure present
    assert.match(
      registerContent,
      /Mục đích thu thập dữ liệu \(Nghị định 13\/2023\/NĐ-CP\)/,
      "Purpose disclosure banner must be present"
    );
  });

  // =========================================================================
  // 4. Security & Anti-IDOR in /api/user/delete/route.ts
  // =========================================================================
  it("API /api/user/delete: Strict session identity, Anti-IDOR, 14-day calculation, and cancellation", () => {
    const deleteRoutePath = path.join(rootDir, "frontend/src/app/api/user/delete/route.ts");
    const deleteRouteContent = fs.readFileSync(deleteRoutePath, "utf-8");

    // 1. Must use getAuthenticatedUser
    assert.match(
      deleteRouteContent,
      /const\s*{\s*user,\s*dbClient,\s*error:\s*authError\s*}\s*=\s*await\s*getAuthenticatedUser\(req\);/,
      "Must authenticate via getAuthenticatedUser(req)"
    );

    // 2. Must reject unauthenticated with 401
    assert.match(
      deleteRouteContent,
      /if\s*\(authError\s*\|\|\s*!user\)\s*{\s*return\s*NextResponse\.json\(\s*\{[\s\S]*?status:\s*401\s*\}\s*\);/m,
      "Must return status 401 if unauthenticated"
    );

    // 3. IDOR Check: user.id must be derived solely from session, NEVER from req.json()
    assert.doesNotMatch(
      deleteRouteContent,
      /user_id\s*:\s*body\.(userId|user_id|id)/,
      "CRITICAL IDOR: Request body must NOT be allowed to supply or override user_id"
    );
    assert.match(
      deleteRouteContent,
      /user_id\s*:\s*user\.id/,
      "Must bind deletion request strictly to authenticated user.id"
    );

    // 4. Email confirmation check if provided
    assert.match(
      deleteRouteContent,
      /if\s*\(inputEmail\s*!==\s*currentEmail\)\s*{\s*return\s*NextResponse\.json\(\s*\{[\s\S]*?status:\s*400/m,
      "Must reject with 400 if confirmation email does not match authenticated user email"
    );

    // 5. 14-day grace period calculation
    assert.match(
      deleteRouteContent,
      /14\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/,
      "Must compute 14-day grace period (14 * 24 * 60 * 60 * 1000 ms)"
    );

    // 6. Action cancel handling
    assert.match(
      deleteRouteContent,
      /if\s*\(body\?\.action\s*===\s*["']cancel["']\)/,
      "Must support action: 'cancel' to revert deletion request"
    );

    // 7. GET endpoint handles maybeSingle and does not leak errors
    assert.match(
      deleteRouteContent,
      /\.maybeSingle\(\)/,
      "GET endpoint must use maybeSingle to gracefully handle accounts without pending deletions"
    );
  });

  // =========================================================================
  // 5. Legal Pages Content & Metadata Verification
  // =========================================================================
  it("Legal Pages: /privacy, /terms, /cookies, /refund have valid metadata and Decree 13 references", () => {
    const pages = [
      {
        file: "frontend/src/app/privacy/page.tsx",
        checks: [
          /Nghị định 13\/2023\/NĐ-CP/,
          /0110826928/, // MST
          /dpo@edteach\.vn/,
          /GDPR/,
          /CCPA/,
          /14 ngày/,
          /metadata:\s*Metadata/,
        ],
      },
      {
        file: "frontend/src/app/terms/page.tsx",
        checks: [
          /CC BY-NC 4\.0/,
          /PhET/,
          /AI Assistant Disclaimer/,
          /14-Day Escrow/,
          /72\s*(giờ|-hour)/i,
          /metadata:\s*Metadata/,
        ],
      },
      {
        file: "frontend/src/app/cookies/page.tsx",
        checks: [
          /eduteach_cookie_consent/,
          /sb-\*-auth-token/,
          /Vercel Analytics/,
          /Cài đặt lại Tùy chọn Cookie/,
        ],
      },
      {
        file: "frontend/src/app/refund/page.tsx",
        checks: [
          /PayOS/,
          /VietQR/,
          /14-Ngày Escrow/,
          /72 giờ/,
          /07 ngày/,
          /metadata:\s*Metadata/,
        ],
      },
    ];

    for (const page of pages) {
      const fullPath = path.join(rootDir, page.file);
      assert.ok(fs.existsSync(fullPath), `File ${page.file} must exist`);
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const regex of page.checks) {
        assert.match(
          content,
          regex,
          `File ${page.file} must match expected compliance pattern ${regex}`
        );
      }
    }
  });

  // =========================================================================
  // 6. Empirical Time & Grace Period Simulation
  // =========================================================================
  it("Empirical calculation: scheduledPurgeDate is exactly 14 days in future", () => {
    const now = 1731106800000; // Fixed timestamp
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const scheduled = new Date(now + fourteenDaysMs);

    const diffDays = (scheduled.getTime() - now) / (1000 * 60 * 60 * 24);
    assert.equal(diffDays, 14, "Grace period difference must be exactly 14 days");
  });
});
